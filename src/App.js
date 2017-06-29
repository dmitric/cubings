import React, { Component } from 'react';
import './App.css';
import Hammer from 'hammerjs'

import {interpolateRdYlBu} from 'd3-scale-chromatic'

let cubes = []
let degs = []
let vertexDrops = []

class App extends Component {

  constructor (props) {
    super(props)

    this.state = {
      backgroundColor: '#f5f5f5',
      displayColorPickers: true,
      dimension: 1,
      rows: 1,
      padding: 120,
      width: 500,
      height: 500,
      paper: 0,
      frame: 0,
      running: true,
    }
  }

  componentWillUnmount () {
    window.removeEventListener("resize", this.updateDimensions.bind(this), true)
    window.removeEventListener('keydown', this.handleKeydown.bind(this), true)
    window.clearInterval(this.interval)
  }

  componentDidMount () {
    window.addEventListener("resize", this.updateDimensions.bind(this), true)
    window.addEventListener('keydown', this.handleKeydown.bind(this), true)
    this.interval = window.setInterval(this.tick.bind(this), 50)

    const mc = new Hammer(document, { preventDefault: true })

    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    mc.get('pinch').set({ enable: true })

    mc.on("swipedown", ev => this.decrementRows())
      .on("swipeup", ev => this.incrementRows())
      .on("swipeleft", ev => this.incrementDimension())
      .on("swiperight", ev => this.decrementDimension())
      .on("pinchin", ev => {this.incrementDimension(); this.incrementRows()})
      .on("pinchout", ev => {this.decrementDimension(); this.decrementRows()})
  }

  handleKeydown (ev) {
    if (ev.which === 67 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.setState({displayColorPickers: !this.state.displayColorPickers})
    } else if (ev.which === 83 && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.handleSave()
    } else if (ev.which === 82 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      cubes = []
      degs = []
      this.forceUpdate()
    } else if (ev.which === 80 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      //this.togglePaper()
    } else if (ev.which === 84) {
      ev.preventDefault()
      this.toggleRun()
    } else if (ev.which === 40) {
      ev.preventDefault()
      if (ev.metaKey || ev.ctrlKey) {
        this.decrementDimension()
      }
      this.decrementRows()
    } else if (ev.which === 38) {
      ev.preventDefault()
      if (ev.metaKey || ev.ctrlKey) {
        this.incrementDimension()
      }
      this.incrementRows()
    } else if (ev.which === 37) {
      ev.preventDefault()
      this.decrementDimension()
    } else if (ev.which === 39) {
      ev.preventDefault()
      this.incrementDimension()
    }
  }

  decrementDimension () {
    cubes = []
    degs = []
    this.setState({dimension: Math.max(1, this.state.dimension - 1) })
  }

  incrementDimension () {
    cubes = []
    degs = []
    this.setState({dimension: Math.min(10, this.state.dimension + 1) })
  }

  decrementRows () {
    cubes = []
    degs = []
    this.setState({rows: Math.max(1, this.state.rows - 1) })
  }

  incrementRows () {
    cubes = []
    degs = []
    this.setState({rows: Math.min(10, this.state.rows + 1) })
  }

  toggleRun() {
    this.setState({running: !this.state.running})
  }

  componentWillMount () {
    this.updateDimensions()
  }

  between (min, max) {
    return Math.random()*(max-min+1.) + min;
  }

  bound (value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  actualHeight () {
    return this.state.height-2*this.state.padding
  }

  actualWidth () {
    return this.state.width-2*this.state.padding
  }

  tick () {
    if (this.state.running) {
      this.forceUpdate()
    }
  }

  render() {
    const actualHeight = this.actualHeight()
    const actualWidth = this.actualWidth()

    const dx = actualWidth/this.state.dimension
    const dy = actualHeight/this.state.rows

    //console.log(cube.getVertices(dx, dy))

    for (let i = 0; i < this.state.dimension * this.state.rows; i++) {
      const center = new Point3(0, dy, 0)
      const cube = cubes[i] || new Cube(center, Math.min(dx, dy) *0.5)
      const deg = degs[i] || [ (Math.random() > 0.5 ? -1 : 1 ) * this.between(20, 360), (Math.random() > 0.5 ? -1 : 1 ) * this.between(20, 720)]

      if (cubes[i] === undefined) {
        cubes.push(cube)
        degs.push(deg)
      }

      for (let ci = 0, cii = 8; ci < cii; ci++) {
        Rotate(cube.vertices[ci], center, Math.PI / deg[0], Math.PI / deg[1]);
      }
      
    }

    return (
      <div className="App">
        <div style={{ padding: this.state.padding }}> 
          <svg width={actualWidth} height={actualHeight} style={{ overflow: 'none' }}>
            <rect width={"100%"} height={"100%"}  fill={this.state.backgroundColor} />
            <g>
              {cubes.map( (cube, i) => {
                const xPos = dx * (i % this.state.dimension) + dx/2
                const yPos = dy/2 + dy * Math.floor(i/this.state.dimension)
                return <g key={i}>{cube.render(xPos, yPos)}</g>
              })}
            </g>
            <g>
              {vertexDrops.map((d, i)=> {
                return <rect key={i} x={d[0]} y={d[1]} width={1} height={1} fill="rgba(0,0,0,0.2)" />
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  }

  updateDimensions () {
    const w = window,
        d = document,
        documentElement = d.documentElement,
        body = d.getElementsByTagName('body')[0]
    
    const width = w.innerWidth || documentElement.clientWidth || body.clientWidth,
        height = w.innerHeight|| documentElement.clientHeight|| body.clientHeight

    const dim = Math.min(width, height)
    const settings = { width: dim , height: dim }

    if (settings.width >= 500) {
      settings.padding = 60
    } else {
      settings.padding = 0
    }

    cubes = []
    degs = []

    this.setState(settings)
  }

  handleSave () {
    const svgData = document.getElementsByTagName('svg')[0].outerHTML   
    const link = document.createElement('a')
    
    var svgBlob = new Blob([svgData], { type:"image/svg+xml;charset=utf-8" })
    var svgURL = URL.createObjectURL(svgBlob)
    link.href = svgURL 

    link.setAttribute('download', `cubings.svg`)
    link.click()
  }
}

class Point2 {
  constructor (x, y) {
    this.x = typeof x === 'number' ? x : 0;
    this.y = typeof y === 'number' ? y : 0;
  }
}

class Point3 extends Point2 {
  constructor (x, y, z) {
    super(x, y);
    this.z = typeof z === 'number' ? z : 0;
  }
}

const Project = (vertice) => new Point2(vertice.x, vertice.z);

const Rotate = (vertice, center, theta, phi) => {
  var ct = Math.cos(theta),
      st = Math.sin(theta),
      cp = Math.cos(phi),
      sp = Math.sin(phi),

      x = vertice.x - center.x,
      y = vertice.y - center.y,
      z = vertice.z - center.z;

  vertice.x = ct * x - st * cp * y + st * sp * z + center.x;
  vertice.y = st * x + ct * cp * y - ct * sp * z + center.y;
  vertice.z = sp * y + cp * z + center.z;
}

class Cube {
  constructor (center, size) {
    const d = size / 2;

    this.vertices = [
      new Point3(center.x - d, center.y - d, center.z + d),
      new Point3(center.x - d, center.y - d, center.z - d),
      new Point3(center.x + d, center.y - d, center.z - d),
      new Point3(center.x + d, center.y - d, center.z + d),
      new Point3(center.x + d, center.y + d, center.z + d),
      new Point3(center.x + d, center.y + d, center.z - d),
      new Point3(center.x - d, center.y + d, center.z - d),
      new Point3(center.x - d, center.y + d, center.z + d)
    ];

    this.faces = [
      [this.vertices[0], this.vertices[1], this.vertices[2], this.vertices[3]],
      [this.vertices[3], this.vertices[2], this.vertices[5], this.vertices[4]],
      [this.vertices[4], this.vertices[5], this.vertices[6], this.vertices[7]],
      [this.vertices[7], this.vertices[6], this.vertices[1], this.vertices[0]],
      [this.vertices[7], this.vertices[0], this.vertices[3], this.vertices[4]],
      [this.vertices[1], this.vertices[6], this.vertices[5], this.vertices[2]]
    ];
  }

  getVertices (dx, dy) {
    const vertices = []
    
    for (let i = 0, ii = this.vertices.length; i < ii; i++) {
      let vertice = this.vertices[i];
      let point = Project(vertice)
      let adjustedPoint = [point.x + dx, -point.y + dy]

      vertices.push(adjustedPoint)
    }

    return vertices
  }

  render (dx, dy) {
    const edges = []

    for(let i = 0, ii = this.faces.length; i < ii; i++) {
      let face = this.faces[i];
      let point = Project(face[0]);
      
      var str = `M${point.x + dx} ${-point.y + dy}`;
      
      for(let o = 1, oo = face.length; o < oo; o++) {
        point = Project(face[o]);
        str += ` L ${point.x + dx} ${-point.y + dy}`;
      }

      str += ` Z`
      edges.push(<path key={i} d={str} fill={interpolateRdYlBu(i/ii)} fillOpacity='0.2' stroke='rgba(0, 0, 0, .5)' />)
    }

    return edges
  }
}

export default App;
