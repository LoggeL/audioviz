const { Plugin } = require('powercord/entities')

module.exports = class AudioViz extends Plugin {
  startPlugin() {
    setTimeout(() => {
      this.intervals = []
      this.startVisualizer()
      this.loadStylesheet('style.scss')
    }, 0)
  }

  reload() {
    this.stopVisualizer()
    this.startVisualizer()
  }

  pluginWillUnload() {
    this.stopVisualizer()
  }

  stopVisualizer() {
    clearInterval(this.interval)
    cancelAnimationFrame(this.frame)
    const viz = document.getElementById('vp-audioviz-visualizer');
    viz.parentNode.removeChild(viz);
  }

  startVisualizer() {
    const { desktopCapturer } = require('electron')
    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        }
      })

      const audioCtx = new AudioContext()
      const audio = audioCtx.createMediaStreamSource(stream)
      const easeInOutCubic = t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
      const barCount = 20

      const analyser = audioCtx.createAnalyser()
      audio.connect(analyser)
      analyser.fftSize = 1024
      let accountContainer
      let visualizer = document.createElement('div')
      visualizer.classList.add('vp-audioviz-visualizer')
      visualizer.id = 'vp-audioviz-visualizer'
      for (let i = 0; i < barCount; i++) {
        let bar = document.createElement('div')
        bar.classList.add('vp-audioviz-bar')
        visualizer.appendChild(bar)
      }

      const findElement = setInterval(() => {
        if (accountContainer) {
          visualizer = document.querySelector('.vp-audioviz-visualizer')
        } else {
          accountContainer = document.querySelector('.panels-j1Uci_ > .container-3baos1:last-child')
          if (accountContainer) {
            accountContainer.prepend(visualizer)
          }
        }
      }, 1000)
      const func = () => {
        if (!visualizer) return
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        for (let i = 0; i < barCount; i++) {
          const y = dataArray[i * 2]
          const height = easeInOutCubic(Math.min(1, y / 255)) * 90
          const bar = visualizer.children[i]
          bar.style.height = `${height}%`;
        }
        requestAnimationFrame(func)
      }
      const style = requestAnimationFrame(func)
      this.interval = findElement;
      this.frame = style
    }).catch(error => {
      console.error('An error occurred getting media sources', error)
    })
  }
}
