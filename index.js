exports.decorateTerm = (Term, { React, notify }) => {
  return class extends React.Component {
    constructor (props, context) {
      super(props, context);

      // Draw a frame, this is where physiscs is handled
      this._drawFrame = this._drawFrame.bind(this);

      // Set canvas size for bounces
      this._resizeCanvas = this._resizeCanvas.bind(this);

      // Set this._div and this._canvas
      this._onDecorated = this._onDecorated.bind(this);

      // Spawn letter when cursor moves
      this._onCursorMove = this._onCursorMove.bind(this);

      // Set letter spawn location
      this._spawnLetter = this._spawnLetter.bind(this)
      
      this._div = null;
      this._canvas = null;

      // Hold array of letters to handle in _drawFrame
      this._letters = [];
      this._active = false;
    }

    _spawnLetter (letter, x, y) {
      const length = this._letters.length;

      // Initial values
      this._letters.push({
        // Character in question
        letter,
        // position
        x,
        y,
        // rotation
        rot: 0,
        // velocity
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.4,
        // radial velocity
        vr: (Math.random() - 0.5) * 0.1,
        // time to live
        ttl: 1000,
        lastBounce: 0
      });

      if (!this._active) {
        window.requestAnimationFrame(this._drawFrame);
        this._active = true
      }  
    }

    _onDecorated (term) {
      if (this.props.onDecorated) this.props.onDecorated(term);
      this._div = term ? term.termRef : null;
      this._initCanvas();
    }

    _initCanvas () {
      this._canvas = document.createElement('canvas');
      this._canvas.style.position = 'absolute';
      this._canvas.style.top = '0';
      this._canvas.style.pointerEvents = 'none';
      this._canvasContext = this._canvas.getContext('2d');
      this._canvas.width = window.innerWidth;
      this._canvas.height = window.innerHeight;
      document.body.appendChild(this._canvas);
      // window.requestAnimationFrame(this._drawFrame);
      window.addEventListener('resize', this._resizeCanvas);
      window.addEventListener('keydown', (ev) => {
        if (ev.key.match(/^[\u0020-\u007e\u00a0-\u00ff]$/)) {
          let origin = this._div.getBoundingClientRect();
          let modifiers = []
          ev.ctrlKey && modifiers.push('Ctrl')
          this._spawnLetter((ev.ctrlKey ? '^' : '') + ev.key, this._cursorPosition.x + origin.left, this._cursorPosition.y + origin.top)
        }
      })
    }

    _drawFrame (time) {
      if (!this._lastRender) {
        this._lastRender = time
        window.requestAnimationFrame(this._drawFrame);
        return
      }
      let dt = time - this.lastRender
      this.lastRender = time

      console.log(dt)
      
      // this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);
      // this._canvasContext.fillStyle = 'rgba(255,0,0,0.4)'
      this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);
      // this._canvasContext.fillRect(0, 0, this._canvas.width, this._canvas.height - 100);
      // handle each letter
      this._letters.forEach(l => {
        // when the character bounces off bottom
        if (l.lastBounce > 10 && l.y > this._canvas.height - 10) {
          // bouncyness
          l.vy *= -0.6

          // inverse rotation
          l.vr *= -1

          // dampen horizontal speed
          l.vx *= 0.8
          l.lastBounce = 0
        }

        l.lastBounce++

        // TODO: Maybe handle left / right walls too?

        // gravity
        l.vy += 0.02

        // physics
        l.x += l.vx * dt
        l.y += l.vy * dt

        // rotation
        l.rot += l.vr * dt
        l.ttl--

        this._canvasContext.save();
        this._canvasContext.translate(l.x, l.y);
        this._canvasContext.rotate(l.rot);
        this._canvasContext.font = `${this.props.fontSize}pt ${this.props.fontFamily}`;
        this._canvasContext.fillStyle = this.props.foregroundColor;
        this._canvasContext.textAlign = 'center';
        this._canvasContext.fillText(l.letter, 0, 0);
        this._canvasContext.restore();
      })

      // request a new animation frame when there are still letters left
      if (this._letters.length > 0) {
        window.requestAnimationFrame(this._drawFrame);
      } else {
        this._active = false;
      }

      // remove letter when TTL is 0
      this._letters = this._letters.filter(l => l.ttl > 0);
    }

    _resizeCanvas () {
      this._canvas.width = window.innerWidth;
      this._canvas.height = window.innerHeight;
    }

    _onCursorMove (cursorFrame) {
      if (this.props.onCursorMove) this.props.onCursorMove(cursorFrame);
      
      const { x, y } = cursorFrame;
      this._cursorPosition = {x , y}
      // const origin = this._div.getBoundingClientRect();
      /* requestAnimationFrame(() => {
        // this._spawnLetter(x+origin.left, y+origin.top);
        if (!active) {
          active = true;
          this._drawFrame();
        }
      })*/
    }

    render () {
      return React.createElement(Term, Object.assign({}, this.props, {
        onDecorated: this._onDecorated,
        onCursorMove: this._onCursorMove
      }));
    }

    componentWillUnmount () {
      document.body.removeChild(this._canvas);
    }
  }
}