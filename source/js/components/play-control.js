'use strict';
/**
 * @file play-control.js
 *
 * Play control
 */

import $ from 'jquery';
import Control from './control';

/**
 * @class PlayControl
 * @param {Player} player Main player
 * @extends Control
 */
class PlayControl extends Control {
	constructor (player, options={}) {
		options = $.extend({}, {
			iconName : 'play',
			title : 'Воспроизвести видео',
			className : 'play'
		}, options);
		super(player, options);
	}

	/**
	 * Pause the video
	 */
	pause () {
		this.icon.iconName = 'play';
		this.element.attr('title', this.options.title);
	}

	/**
	 * Play the video
	 */
	play () {
		this.icon.iconName = 'pause';
		this.element.attr('title', 'Поставить на паузу');
	}

	/**
	 * @override
	 */
	onClick(e) {
		//super.onClick(e);
		this.player.video.togglePlay();
	}
}

export default PlayControl;
