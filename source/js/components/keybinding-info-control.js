
'use strict';
/**
 * @file keybinding-info-control.js
 *
 * Info control
 */

import $ from 'jquery';
import ControlDropdown from './control-dropdown';

/**
 * @param {Player} player Main player
 * @class KeyBindingInfoControl
 * @extends ControlDropdown
 */
class KeyBindingInfoControl extends ControlDropdown {

	constructor(player, options) {
		options = $.extend({}, {
			iconName : 'info',
			title : 'Инфо',
			className : 'info-control'
		}, options);
		super(player, options);
	}

	createElement() {
		super.createElement();
		let keyBinding = this.player.options.keyBinding;
		let infoContent = ``;
		for (let _key in keyBinding) {
			if (!keyBinding.hasOwnProperty(_key)) continue;

			let hotkey = keyBinding[_key];
			let item = '';
			let keyString = '';

			hotkey.info.forEach((key, index) => {
				if (index != 0) {
					keyString += ` + `
				}
				keyString += `<div class="leplayer-key">${key}</div>`
			});

			item = `
				<div class="info-control__item">
					${keyString} - ${hotkey.description}
				</div>
			`

			infoContent += item;

		}
		this.dropdownContent
			.addClass('info-control__content')
			.append(infoContent);
	}
}

export default KeyBindingInfoControl;