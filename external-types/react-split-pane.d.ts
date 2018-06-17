//declare module 'react-split-pane' {
declare module 'SplitPane' {
  //import * as Prefixer from 'inline-style-prefixer';
  import * as React from 'react';

  export type Size = string | number;

  export interface Props {
      allowResize?: boolean;
      className?: string;
      primary?: 'first' | 'second';
      minSize?: Size;
      maxSize?: Size;
      defaultSize?: Size;
      size?: Size;
      split?: 'vertical' | 'horizontal';
      onDragStarted?: () => void;
      onDragFinished?: (newSize: number) => void;
      onChange?: (newSize: number) => void;
      onResizerClick?: (event: MouseEvent) => void;
      onResizerDoubleClick?: (event: MouseEvent) => void;
      prefixer?: any //Prefixer;
      style?: React.CSSProperties;
      resizerStyle?: React.CSSProperties;
      paneStyle?: React.CSSProperties;
      pane1Style?: React.CSSProperties;
      pane2Style?: React.CSSProperties;
      resizerClassName?: string;
      step?: number;
  }

  export interface State {
      active: boolean;
      resized: boolean;
  }

  export default class SplitPane extends React.Component<Props, State> {
      constructor();

      onMouseDown(event: MouseEvent): void;

      onTouchStart(event: TouchEvent): void;

      onMouseMove(event: MouseEvent): void;

      onTouchMove(event: TouchEvent): void;

      onMouseUp(): void;

      setSize(props: Props, state: State): void;

      static defaultProps: Props;
  }

}