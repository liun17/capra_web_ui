export interface CameraMap {
  [cameraName: string]: CameraOptions
}

export interface Camera {
  cameraName: string
  options: CameraOptions
}

export interface CameraOptions {
  type: CameraType
  topic: string
}

export enum CameraType {
  MJPEG = 'mjpeg',
  PNG = 'png',
  MJPEG_CANVAS = 'mjpeg_canvas',
  VP8 = 'vp8',
  WEB_RTC = 'web_rtc',
}
