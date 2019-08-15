export interface FeedState {
  feeds: FeedCollection
  feedMap: FeedMap
}

export interface FeedMap {
  [id: string]: {
    id: string
    feedId: string
  }
}

export enum FeedType {
  video,
  minimap2D,
  minimap3D,
  model,
  joystick,
}

export enum CameraType {
  img,
  png,
  vp8,
}

export interface FeedCollection {
  [feedId: string]: Feed
}

export type Feed =
  | CameraFeed
  | Minimap2DFeed
  | Minimap3DFeed
  | ModelFeed
  | JoystickFeed

export interface CameraFeed {
  type: FeedType.video
  id: string
  camera: Camera
}

export interface Camera {
  name: string
  type: CameraType
}

interface MinimapFeed {
  id: string
  socketConnection: string
}

export interface Minimap2DFeed extends MinimapFeed {
  type: FeedType.minimap2D
}

export interface Minimap3DFeed extends MinimapFeed {
  type: FeedType.minimap3D
}

export interface ModelFeed {
  type: FeedType.model
  id: string
}

export interface JoystickFeed {
  type: FeedType.joystick
  id: string
}