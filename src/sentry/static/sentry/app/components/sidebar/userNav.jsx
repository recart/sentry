import React from 'react';
import ConfigStore from '../../stores/configStore';
import DropdownLink from '../dropdownLink';
import Avatar from '../avatar';
import MenuItem from '../menuItem';
import {t} from '../../locale';

const UserNav = React.createClass({
  propTypes: {
    orgId: React.PropTypes.string
  },

  contextTypes: {
    location: React.PropTypes.object
  },

  shouldComponentUpdate(nextProps, nextState) {
    return false;
  },

  render() {
    let user = ConfigStore.get('user');

    if (!user) {
      // TODO
      return null;
    }

    let title = (
      <Avatar user={user} className="avatar" />
    );

    // "to" attribute => in-app router
    // "href" attribute => Django-powered views
    let to = (url) => this.context.location ? {to: url} : {href: url};

    return (
      <DropdownLink
          topLevelClasses={this.props.className}
          title={title}
          caret={false}
          >
        <MenuItem to={`/organizations/${this.props.orgId}/users/${user.id}/`}>{t('Profile')}</MenuItem>
        <MenuItem href="/account/settings/">{t('Settings')}</MenuItem>
        <MenuItem {...to('/api/')}>{t('API')}</MenuItem>
        {user.isSuperuser &&
          <MenuItem {...to('/manage/')}>{t('Admin')}</MenuItem>
        }
        <MenuItem href="/auth/logout/">{t('Sign out')}</MenuItem>
      </DropdownLink>
    );
  }
});

export default UserNav;
