import React from 'react';
import {shallow, mount} from 'enzyme';
import DropdownLink from 'app/components/dropdownLink';

describe('DropdownLink', function() {
  const INPUT_1 = {
    title: 'test',
    onOpen: () => {},
    onClose: () => {},
    topLevelClasses: 'top-level-class',
    menuClasses: '',
  };

  describe('renders', function() {
    it('and anchors to left by default', function() {
      let component = shallow(
        <DropdownLink {...INPUT_1}>
          <div>1</div>
          <div>2</div>
        </DropdownLink>
      );

      expect(component).toMatchSnapshot();
    });

    it('and anchors to right', function() {
      let component = shallow(
        <DropdownLink {...INPUT_1} anchorRight>
          <div>1</div>
          <div>2</div>
        </DropdownLink>
      );

      expect(component).toMatchSnapshot();
    });
  });

  describe('Uncontrolled', function() {
    let wrapper;

    beforeEach(function() {
      if (wrapper) {
        wrapper.unmount();
      }

      wrapper = mount(
        <DropdownLink title="test">
          <li>hi</li>
        </DropdownLink>
      );
    });

    describe('While Closed', function() {
      it('displays dropdown menu when dropdown actor button clicked', function() {
        expect(wrapper.find('li').length).toBe(0);
        expect(wrapper.state('isOpen')).toBe(false);

        // open
        wrapper.find('a').simulate('click');
        expect(wrapper.state('isOpen')).toBe(true);
        expect(wrapper.find('li').length).toBe(1);
      });
    });
    describe('While Opened', function() {
      beforeEach(function() {
        // Opens dropdown menu
        wrapper.find('a').simulate('click');
      });

      it.skip('closes when clicked outside', function() {
        jQuery(document).click();
        expect(wrapper.state('isOpen')).toBe(false);
        expect(wrapper.instance().checkClickOutside).toHaveBeenCalled();
      });

      it('closes when dropdown actor button is clicked', function() {
        wrapper.find('a').simulate('click');
        expect(wrapper.state('isOpen')).toBe(false);
      });

      it('closes when dropdown menu item is clicked', function() {
        wrapper.find('li').simulate('click');
        expect(wrapper.state('isOpen')).toBe(false);
      });

      it('does not close when menu is clicked and `keepMenuOpen` is on', function() {
        wrapper = mount(
          <DropdownLink title="test" keepMenuOpen>
            <li>hi</li>
          </DropdownLink>
        );
        wrapper.find('a').simulate('click');
        wrapper.find('li').simulate('click');
        expect(wrapper.state('isOpen')).toBe(true);
        wrapper.unmount();
      });
    });
  });

  describe('Controlled', function() {
    let wrapper;

    beforeEach(function() {
      if (wrapper) {
        wrapper.unmount();
      }
    });
    describe('Opened', function() {
      beforeEach(function() {
        wrapper = mount(
          <DropdownLink isOpen={true} title="test">
            <li>hi</li>
          </DropdownLink>
        );
      });

      it('does not close when menu is clicked', function() {
        // open
        wrapper.find('li').simulate('click');
        // State does not change
        expect(wrapper.state('isOpen')).toBe(false);
        expect(wrapper.find('.dropdown-menu').length).toBe(1);
      });

      it('does not close when document is clicked', function() {
        jQuery(document).click();
        // State does not change
        expect(wrapper.state('isOpen')).toBe(false);
        expect(wrapper.find('.dropdown-menu').length).toBe(1);
      });

      it('does not close when dropdown actor is clicked', function() {
        wrapper.find('a').simulate('click');
        // State does not change
        expect(wrapper.state('isOpen')).toBe(false);
        expect(wrapper.find('.dropdown-menu').length).toBe(1);
      });
    });
    describe('Closed', function() {
      beforeEach(function() {
        wrapper = mount(
          <DropdownLink isOpen={false} title="test">
            <li>hi</li>
          </DropdownLink>
        );
      });

      it('does not open when dropdown actor is clicked', function() {
        wrapper.find('a').simulate('click');
        // State does not change
        expect(wrapper.state('isOpen')).toBe(false);
        expect(wrapper.find('.dropdown-menu').length).toBe(0);
      });
    });
  });

  describe('Nested Dropdown', function() {
    let wrapper;

    beforeEach(function() {
      if (wrapper) {
        wrapper.unmount();
      }

      wrapper = mount(
        <DropdownLink title="parent">
          <DropdownLink title="nested" isNestedDropdown={true}>
            Test
          </DropdownLink>
        </DropdownLink>
      );
    });

    it('Opens / closes on mouse enter and leave', function() {
      wrapper.find('a').simulate('click');
      wrapper.find('.dropdown-menu a').simulate('mouseEnter');
      expect(wrapper.find('.dropdown-menu').length).toBe(2);

      wrapper.find('.dropdown-menu a').simulate('mouseLeave');

      expect(wrapper.find('.dropdown-menu').length).toBe(1);
    });
  });
});
