from __future__ import absolute_import

from django.http import Http404
from django.utils.encoding import force_str
from django.core.signing import BadSignature, SignatureExpired

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sentry import roles
from sentry.api.base import Endpoint, SessionAuthentication
from sentry.api.decorators import sudo_required
from sentry.api.serializers import serialize
from sentry.api.serializers.models.organization import DetailedOrganizationSerializer
from sentry.utils.signing import unsign
from sentry.models import (
    AuditLogEntryEvent, OrganizationMember, Organization, OrganizationStatus, Team, Project
)


class InvalidPayload(Exception):
    pass


class AcceptProjectTransferEndpoint(Endpoint):
    authentication_classes = (SessionAuthentication, )
    permission_classes = (IsAuthenticated, )

    def get_validated_data(self, data, user):
        try:
            data = unsign(force_str(data))
        except BadSignature:
            raise InvalidPayload('Could not approve transfer, please make sure link is valid.')
        except SignatureExpired:
            raise InvalidPayload('Project transfer link has expired.')

        if data['user_id'] != user.id:
            raise InvalidPayload('Invalid permissions')

        try:
            project = Project.objects.get(
                id=data['project_id'], organization_id=data['from_organization_id'],
            )
        except Project.DoesNotExist:
            raise InvalidPayload('Project no longer exists')

        return data, project

    @sudo_required
    def get(self, request):
        try:
            data = request.GET['data']
        except KeyError:
            raise Http404

        try:
            data, project = self.get_validated_data(data, request.user)
        except InvalidPayload as exc:
            return Response({'detail': exc.message}, status=400)

        organizations = Organization.objects.filter(
            status=OrganizationStatus.ACTIVE,
            id__in=OrganizationMember.objects.filter(
                user=request.user,
                role=roles.get_top_dog().id,
            ).values_list('organization_id', flat=True),
        )

        return Response({
            'organizations': serialize(list(organizations), request.user, DetailedOrganizationSerializer()),
            'project': {
                'slug': project.slug,
                'id': project.id,
            }
        })

    @sudo_required
    def post(self, request):
        try:
            data = request.DATA['data']
        except KeyError:
            raise Http404

        try:
            data, project = self.get_validated_data(data, request.user)
        except InvalidPayload as exc:
            return Response({'detail': exc.message}, status=400)

        transaction_id = data['transaction_id']

        team_id = request.DATA.get('team')
        if team_id is None:
            return Response({'detail': 'Choose a team to transfer the project to'}, status=400)

        try:
            team = Team.objects.get(
                id=team_id,
            )
        except Team.DoesNotExist:
            return Response({'detail': 'Invalid team'}, status=400)

        # check if user is an owner of the team's org
        is_team_org_owner = OrganizationMember.objects.filter(
            user__is_active=True,
            user=request.user,
            role=roles.get_top_dog().id,
            organization_id=team.organization_id,
        ).exists()

        if not is_team_org_owner:
            return Response({'detail': 'Invalid team'}, status=400)

        project.transfer_to(team)

        self.create_audit_entry(
            request=request,
            organization=project.organization,
            target_object=project.id,
            event=AuditLogEntryEvent.PROJECT_ACCEPT_TRANSFER,
            data=project.get_audit_log_data(),
            transaction_id=transaction_id,
        )

        return Response(status=204)