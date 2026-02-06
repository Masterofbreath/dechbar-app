/**
 * Capacitor Utils - Platform Detection
 * 
 * Utilities for detecting native platform vs web.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Utils
 */

import { Capacitor } from '@capacitor/core';

export const isNativePlatform = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb = platform === 'web';
