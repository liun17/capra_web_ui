import {
  Action,
  Binding,
  Context,
  GamepadState,
  GamepadContext,
  GamepadBtnContext,
  SpaceMouseContext,
} from '~utils/InputSystem/@types'

/* TODO
 * - button axis (RT, LT)
 * - support key combinations?
 */

const isInvalidGamepad = (gamepad: Gamepad) =>
  gamepad.id.includes('Unknown Gamepad') ||
  (gamepad.axes.length === 0 && gamepad.buttons.length === 0)

const keyboardCtx: Context = { type: 'keyboard' }
const emptyCtx: Context = { type: 'none' }

const isPressed = (rawBtn: GamepadButton): boolean =>
  typeof rawBtn == 'number' ? rawBtn > 0.1 : rawBtn.pressed

/**
 * This class is used to handle multiple input devices at the same time. To use
 * it you need to give it an array of actions. Each actions can take one or more
 * bindings that will be checked in a loop.
 *
 * If any of those bindings are true it will perform the action.
 *
 * When performing an action a Context is passed to the callback. This Context
 * contains information like the gamepad id or it's index. If you want to support
 * multiple gamepads at the same time you could check the index when an action is
 * performed and keep a map of users/index.
 *
 * Example usage:
 *
 * const inputsys = new InputSystem([
 *    {
 *      name: 'estop',
 *      bindings: [
 *        { type: 'keyboard', code: 'Space' },
 *        { type: 'gamepadBtn', button: buttons.A },
 *      ],
 *      perform: (ctx) => {
 *        console.log('performed estop')
 *      },
 *    },
 * ])
 * inputsys.start()
 *
 */
export class InputSystem {
  isRunning = false
  private actions: Action[] = []
  private lastTimestamp: number[] = []
  private lastGamepad: Gamepad[] = []
  private isBrowserSupported = true

  constructor(actions: Action[]) {
    this.actions = actions

    if (!navigator.getGamepads) {
      this.isBrowserSupported = false
      console.warn('This browser does not support gamepads.')
      return
    }

    this.initEventListeners()
  }

  start = () => {
    if (this.isBrowserSupported && !this.isRunning) {
      this.isRunning = true
      this.update()
    }
  }

  stop = () => {
    this.isRunning = false
  }

  setActionMap = (actions: Action[]) => {
    this.actions = actions
  }

  private update = () => {
    if (this.isRunning) {
      this.updateGamepad()
      requestAnimationFrame(this.update)
    }
  }

  private checkActionsBindings = (
    checkBinding: (binding: Binding) => [boolean, Context]
  ) => {
    for (const action of this.actions) {
      for (const binding of action.bindings) {
        const [canPerform, context] = checkBinding(binding)
        if (canPerform) action.perform(context)
      }
    }
  }

  private updateGamepad = () => {
    const gamepads = navigator.getGamepads()
    for (let i = 0; i <= gamepads.length; i++) {
      const gamepad = gamepads[i]

      if (!gamepad || isInvalidGamepad(gamepad)) continue

      const gamepadState: GamepadState = {
        gamepad,
        prevGamepad: this.lastGamepad[i],
        index: i,
      }

      const gamepadCtx: GamepadContext = {
        type: 'gamepad',
        id: gamepad.id,
        gamepadState,
      }

      this.checkActionsBindings((b) => {
        switch (b.type) {
          case 'gamepad': {
            if (gamepad.id.includes('SpaceMouse')) {
              return [false, emptyCtx]
            }
            return [true, gamepadCtx]
          }
          case 'keyboard': {
            return [false, emptyCtx]
          }
          case 'gamepadAxis': {
            const value = gamepad.axes[b.axis]
            if (value !== this.lastGamepad[i].axes[b.axis]) {
              const axisCtx: Context = {
                ...gamepadCtx,
                type: 'gamepadAxis',
                value: gamepad.axes[b.axis],
              }
              return [true, axisCtx]
            }
            return [false, emptyCtx]
          }
          case 'gamepadBtn': {
            const btn = gamepad.buttons[b.button]
            const lastBtn = this.lastGamepad[i]?.buttons[b.button]
            const currentlyPressed = btn !== undefined && isPressed(btn)
            const pressedLastUpdate =
              lastBtn !== undefined && isPressed(lastBtn)

            //TODO handle onBtnUp/onBtnDown press
            // currently this returns true once when the button is pressed.
            // There are no events for when the button is held down or when it is released.

            if (currentlyPressed && !pressedLastUpdate) {
              const btnCtx: GamepadBtnContext = {
                ...gamepadCtx,
                type: 'gamepadBtn',
              }
              return [true, btnCtx]
            }
            return [false, emptyCtx]
          }
          case 'spacemouse': {
            if (gamepad.id.includes('SpaceMouse')) {
              const spacemouseCtx: SpaceMouseContext = {
                ...gamepadCtx,
                type: 'spacemouse',
                axes: [...gamepadCtx.gamepadState.gamepad.axes],
                buttons: [...gamepadCtx.gamepadState.gamepad.buttons],
              }
              return [true, spacemouseCtx]
            }

            return [false, emptyCtx]
          }
        }
      })

      this.lastTimestamp[i] = gamepad.timestamp
      this.lastGamepad[i] = gamepad
    }
  }

  private initEventListeners = () => {
    // keyboard
    window.addEventListener('keydown', this.onKeyDown as EventListener, false)
    window.addEventListener('keyup', this.onKeyUp as EventListener, false)

    //gamepad
    window.addEventListener(
      'gamepadconnected',
      this.onGamepadConnected as EventListener,
      false
    )
    window.addEventListener(
      'gamepaddisconnected',
      this.onGamepadDisconnected as EventListener,
      false
    )
  }

  // TODO make keyDown the default
  private onKeyDown = (e: KeyboardEvent) => {
    this.checkActionsBindings((b: Binding): [boolean, Context] => {
      if (b.type !== 'keyboard') return [false, emptyCtx]
      if (b.onKeyDown && b.code === e.code) return [true, keyboardCtx]
      return [false, emptyCtx]
    })
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.checkActionsBindings((b: Binding): [boolean, Context] => {
      if (b.type !== 'keyboard') return [false, emptyCtx]
      if (!b.onKeyDown && b.code === e.code) return [true, keyboardCtx]
      return [false, emptyCtx]
    })
  }

  private onGamepadConnected = (e: GamepadEvent) => {
    const { id, ...rest } = e.gamepad
    // eslint-disable-next-line no-console
    console.log(id, 'connected', rest)
  }
  private onGamepadDisconnected = (e: GamepadEvent) => {
    const { id, ...rest } = e.gamepad
    // eslint-disable-next-line no-console
    console.log(id, 'disconnected', rest)
  }
}
