let letter;

let active = false;

let activeUi

exports.middleware = (store) => (next) => (action) => {
  const {sessions, termGroups, ui} = store.getState()

  switch(action.type) {
    case 'SESSION_ADD':
    case 'SESSION_SET_ACTIVE':
      activeUi = ui
      break
    case 'SESSION_USER_DATA':
      break
    default:
      letter = action.data
      break
  }
  next(action)
};

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
    }

    _spawnLetter (x, y) {
      // Only spawn letter when it is 1 printable character
      if (letter && letter.match(/^[\u0020-\u007e\u00a0-\u00ff]$/)) {
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
          vx: Math.random() - 0.5,
          vy: -1,
          // radial velocity
          vr: (Math.random() - 0.5) * 0.2,
          // time to live
          ttl: 500
        });

        if (!active) {
          window.requestAnimationFrame(this._drawFrame);
        }  
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
      window.requestAnimationFrame(this._drawFrame);
      window.addEventListener('resize', this._resizeCanvas);
    }

    _drawFrame () {
      this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);

      // handle each letter
      this._letters.forEach(l => {

        // when the character bounces off bottom
        if (l.y > this._canvas.height - 10) {
          // bouncyness
          l.vy *= -0.6

          // inverse rotation
          l.vr *= -1

          // dampen horizontal speed
          l.vx *= 0.8
        }

        // TODO: Maybe handle left / right walls too?

        // gravity
        l.vy += 0.02

        // physics
        l.x += l.vx
        l.y += l.vy

        // rotation
        l.rot += l.vr
        l.ttl--

        this._canvasContext.save();
        this._canvasContext.translate(l.x, l.y);
        this._canvasContext.rotate(l.rot);
        this._canvasContext.font = `${activeUi.fontSize}pt ${activeUi.fontFamily}`;
        this._canvasContext.fillStyle = activeUi.foregroundColor;
        this._canvasContext.textAlign = 'center';
        this._canvasContext.fillText(l.letter, 0, 0);
        this._canvasContext.restore();
      })

      // remove letter when TTL is 0
      this._letters = this._letters.filter(l => l.ttl > 0);

      // request a new animation frame when there are still letters left
      if (this._letters.length > 0) {
        window.requestAnimationFrame(this._drawFrame);
      } else {
        active = false;
      }
    }

    _resizeCanvas () {
      this._canvas.width = window.innerWidth;
      this._canvas.height = window.innerHeight;
    }

    _onCursorMove (cursorFrame) {
      if (this.props.onCursorMove) this.props.onCursorMove(cursorFrame);
      
      const { x, y } = cursorFrame;
      const origin = this._div.getBoundingClientRect();
      requestAnimationFrame(() => {
        this._spawnLetter(x+origin.left, y+origin.top);
        if (!active) {
          active = true;
          this._drawFrame();
        }
      })
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