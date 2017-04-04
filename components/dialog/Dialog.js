/* eslint-disable jsx-a11y/aria-role */
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { themr } from 'react-css-themr';
import classnames from 'classnames';
import { DIALOG } from '../identifiers';
import Portal from '../hoc/Portal';
import ActivableRenderer from '../hoc/ActivableRenderer';
import InjectButton from '../button/Button';
import InjectOverlay from '../overlay/Overlay';

function getScroll(w, top) {
  let ret = w[`page${top ? 'Y' : 'X'}Offset`];
  const method = `scroll${top ? 'Top' : 'Left'}`;
  if (typeof ret !== 'number') {
    const d = w.document;
    ret = d.documentElement[method];
    if (typeof ret !== 'number') {
      ret = d.body[method];
    }
  }
  return ret;
}

function offset(el) {
  const rect = el.getBoundingClientRect();
  const pos = {
    left: rect.left,
    top: rect.top,
  };
  const doc = el.ownerDocument;
  const w = doc.defaultView || doc.parentWindow;
  pos.left += getScroll(w);
  pos.top += getScroll(w, true);
  return pos;
}

function setTransformOrigin(node, value) {
  const style = node.style;
  ['Webkit', 'Moz', 'Ms', 'ms'].forEach((prefix) => {
    style[`${prefix}TransformOrigin`] = value;
  });
  style.transformOrigin = value;
}

const factory = (Overlay, Button) => {
  let computeMousePosition; // Save the trigger position
  let mousePositionEventBind; // Click event status

  class Dialog extends React.Component {
    static defaultProps = {
      actions: [],
      active: false,
      type: 'normal',
    };

    static propTypes = {
      actions: PropTypes.arrayOf(PropTypes.shape({
        className: PropTypes.string,
        label: PropTypes.string,
        children: PropTypes.node,
      })),
      active: PropTypes.bool,
      children: PropTypes.node,
      className: PropTypes.string,
      onEscKeyDown: PropTypes.func,
      onOverlayClick: PropTypes.func,
      onOverlayMouseDown: PropTypes.func,
      onOverlayMouseMove: PropTypes.func,
      onOverlayMouseUp: PropTypes.func,
      theme: PropTypes.shape({
        active: PropTypes.string,
        body: PropTypes.string,
        button: PropTypes.string,
        dialog: PropTypes.string,
        navigation: PropTypes.string,
        overflow: PropTypes.string,
        overlay: PropTypes.string,
        title: PropTypes.string,
        wrapper: PropTypes.string,
      }),
      title: PropTypes.string,
      type: PropTypes.string,
    };

    componentDidMount() {
      this.componentDidUpdate({});
      if (mousePositionEventBind) {
        return;
      }
      // Only click events support the animation from the mouse position to expand
      let thisTimeOut;
      document.addEventListener('click', (e) => {
        computeMousePosition = {
          x: e.pageX,
          y: e.pageY,
        };
        // A click event occurred within 20 ms, from the click location animation
        // Otherwise direct zoom display
        clearTimeout(thisTimeOut);
        thisTimeOut = setTimeout(() => {
          computeMousePosition = undefined;
        }, 120);
      }, true);
      mousePositionEventBind = true;
    }

    componentDidUpdate(prevProps) {
      const {
        active,
      } = this.props;
      if (active) {
        // first show
        if (!prevProps.active) {
          const dialogNode = ReactDOM.findDOMNode(this.dialog);
          if (computeMousePosition) {
            const elOffset = offset(dialogNode);
            setTransformOrigin(dialogNode,
              `${computeMousePosition.x - elOffset.left}px ${computeMousePosition.y - elOffset.top}px`);
          } else {
            setTransformOrigin(dialogNode, '');
          }
        }
      }
    }

    handleDialogRef = (ref) => {
      this.dialog = ref;
    };

    render() {
      const {
        actions,
        theme,
        active,
      } = this.props;

      const className = classnames([theme.dialog, theme[this.props.type]], {
        [theme.active]: active,
      }, this.props.className);

      return (
        <Portal className={theme.wrapper}>
          <Overlay
            active={active}
            className={theme.overlay}
            onClick={this.props.onOverlayClick}
            onEscKeyDown={this.props.onEscKeyDown}
            onMouseDown={this.props.onOverlayMouseDown}
            onMouseMove={this.props.onOverlayMouseMove}
            onMouseUp={this.props.onOverlayMouseUp}
            theme={theme}
            themeNamespace="overlay"
          />
          <div
            data-react-toolbox="dialog"
            className={className}
            ref={this.handleDialogRef}
          >
            <section role="body" className={theme.body}>
              {this.props.title ? <h6 className={theme.title}>{this.props.title}</h6> : null}
              {this.props.children}
            </section>
            {actions.length
              ? <nav role="navigation" className={theme.navigation}>
                {actions.map((action, idx) => (
                  <Button
                    key={idx} // eslint-disable-line react/no-array-index-key
                    {...action}
                    className={classnames(theme.button, { [action.className]: action.className })}
                  />
                ))}
              </nav>
              : undefined
            }
          </div>
        </Portal>
      );
    }
  }

  return ActivableRenderer()(Dialog);
};

const Dialog = factory(InjectOverlay, InjectButton);
export default themr(DIALOG)(Dialog);
export { Dialog };
export { factory as dialogFactory };
