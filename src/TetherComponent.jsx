import React, { Component, Children, Fragment } from 'react'
import PropTypes from 'prop-types'
import ReactDOM, { createPortal } from 'react-dom'
import Tether from 'tether'

if (!Tether) {
  console.error('It looks like Tether has not been included. Please load this dependency first https://github.com/HubSpot/tether')
}

const renderElementToPropTypes = [
  PropTypes.string,
  PropTypes.shape({
    appendChild: PropTypes.func.isRequired
  })
];

const childrenPropType = ({ children }, propName, componentName) => {
  const childCount = Children.count(children);
  if (childCount <= 0) {
    return new Error(`${componentName} expects at least one child to use as the target element.`)
  } else if (childCount > 2) {
    return new Error(`Only a max of two children allowed in ${componentName}.`)
  }
};

const attachmentPositions = [
  'auto auto',
  'top left',
  'top center',
  'top right',
  'middle left',
  'middle center',
  'middle right',
  'bottom left',
  'bottom center',
  'bottom right'
];

class TetherComponent extends Component {
  static propTypes = {
    renderElementTag: PropTypes.string,
    attachment: PropTypes.oneOf(attachmentPositions).isRequired,
    targetAttachment: PropTypes.oneOf(attachmentPositions),
    offset: PropTypes.string,
    targetOffset: PropTypes.string,
    targetModifier: PropTypes.string,
    enabled: PropTypes.bool,
    classes: PropTypes.object,
    classPrefix: PropTypes.string,
    optimizations: PropTypes.object,
    constraints: PropTypes.array,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onUpdate: PropTypes.func,
    onRepositioned: PropTypes.func,
    children: childrenPropType
  };

  static defaultProps = {
    renderElementTag: 'div'
  };

  _targetNode = null;
  _popupParentNode = null;
  _tether = false;

  componentDidMount() {
    this._targetNode = ReactDOM.findDOMNode(this);
    this._update()
  }

  componentDidUpdate(prevProps) {
    this._targetNode = ReactDOM.findDOMNode(this);
    this._update()
  }

  componentWillUnmount() {
    this._destroy()
  }

  getTetherInstance() {
    return this._tether
  }

  disable() {
    this._tether.disable()
  }

  enable() {
    this._tether.enable()
  }

  on(event, handler, ctx) {
    this._tether.on(event, handler, ctx);
  }

  once(event, handler, ctx) {
    this._tether.once(event, handler, ctx);
  }

  off(event, handler) {
    this._tether.off(event, handler)
  }

  position() {
    this._tether.position()
  }

  _registerEventListeners() {
    this.on('update', () => {
      return this.props.onUpdate && this.props.onUpdate.apply(this, arguments)
    });

    this.on('repositioned', () => {
      return this.props.onRepositioned && this.props.onRepositioned.apply(this, arguments)
    })
  }

  _destroy() {
    if (this._popupParentNode) {
      this._popupParentNode.parentNode.removeChild(this._popupParentNode)
    }

    if (this._tether) {
      this._tether.destroy()
    }

    this._popupParentNode = null;
    this._tether = null;
  }

  _update() {
    if (this._popupParentNode) {
      this._updateTether()
    }
  }

  _updateTether() {
    const { id, className, style, ...options } = this.props;
    const tetherOptions = {
      target: this._targetNode,
      element: this._popupParentNode,
      ...options
    };

    if (id) {
      this._popupParentNode.id = id
    }

    if (className) {
      this._popupParentNode.className = className
    }

    if (style) {
      Object.keys(style).forEach(key => {
        this._popupParentNode.style[key] = style[key]
      })
    }

    if (!this._tether) {
      this._tether = new Tether(tetherOptions);
      this._registerEventListeners()
    } else {
      this._tether.setOptions(tetherOptions)
    }

    this._tether.position()
  }

  render() {
    const { renderElementTag, children } = this.props;
    const childrenArray = Children.toArray(children);
    const target = childrenArray[0];
    const popup = childrenArray[1];

    if (!popup) {
      if (this._tether) {
        this._destroy()
      }
    } else {
      if (!this._popupParentNode) {
        this._popupParentNode = document.createElement(renderElementTag);
        document.body.appendChild(this._popupParentNode);
      }
    }
    
    const renderPopup = popup && this._popupParentNode && document.body.contains(this._popupParentNode);
    
    return <Fragment>
      {target}
      {renderPopup && createPortal(popup, this._popupParentNode)}
    </Fragment>
  }
}

export default TetherComponent;
