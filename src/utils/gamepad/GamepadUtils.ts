let joySeqId = 0

export const mapGamepadToJoy = (gamepad: Gamepad) => {
  const d = new Date()
  const seconds = Math.round(d.getTime() / 1000)

  return {
    header: {
      seq: joySeqId++,
      stamp: {
        sec: seconds,
        nsecs: 0,
      },
      frame_id: '',
    },
    axes: gamepad.axes.map(x => x  < 0.09?0.0:x),
    buttons: gamepad.buttons.map(x =>  ~~(x.value)) //Convert to int32 (~~)
  }
}
