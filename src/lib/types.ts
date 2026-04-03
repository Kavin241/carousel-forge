// The full design system Gemini returns
export interface DesignSpec {
  vibe: string;
  vibeName: string;
  palette: {
    background: string;       // hex
    primary: string;          // hex - main text colour
    accent: string;           // hex - highlights, rules, tags
    secondary: string;        // hex - body text, subtext
  };
  typography: {
    heading: {
      fontFamily: string;     // must be from CANVA_FREE_FONTS list
      fontWeight: '400' | '700' | '900';
      letterSpacing: number;  // em units, e.g. -0.02
    };
    body: {
      fontFamily: string;
      fontWeight: '400' | '500' | '700';
      letterSpacing: number;
    };
    accent: {
      fontFamily: string;     // used for labels, slide numbers
      fontWeight: '400' | '500' | '700';
      letterSpacing: number;
    };
  };
  backgroundStyle: 'solid' | 'gradient' | 'noise' | 'split';
  gradientConfig?: {
    angle: number;
    colorStop1: string;
    colorStop2: string;
  };
  layoutStyle: 'centered' | 'left_heavy' | 'asymmetric' | 'top_anchored';
  graphicElements: GraphicElement[];
  slides: SlideSpec[];
  contentAngle: string;       // brief description of narrative framing
  trendNote: string;          // e.g. "bold editorial, trending Q1 2025"
}

export interface SlideSpec {
  index: number;
  type: 'hook' | 'point' | 'elaboration' | 'callout' | 'cta';
  heading: string;
  body: string | null;
  label: string | null;       // e.g. "01", "Key Insight", "Tip 3"
  layout: SlideLayout;
}

export interface SlideLayout {
  headingPosition: ElementPosition;
  bodyPosition: ElementPosition | null;
  labelPosition: ElementPosition | null;
  headingFontSize: number;    // px, based on 1080x1080
  bodyFontSize: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface ElementPosition {
  x: number;                  // percentage of canvas width, 0-100
  y: number;                  // percentage of canvas height, 0-100
  width: number;              // percentage of canvas width
  maxLines?: number;
}

export interface GraphicElement {
  type: 'horizontal_rule' | 'corner_tag' | 'circle_accent' | 
        'side_bar' | 'background_shape' | 'dot_grid' | 'slash_divider';
  position: ElementPosition;
  color: 'accent' | 'primary' | 'secondary'; // references palette
  opacity: number;            // 0-1
  size: number;               // relative size unit
}

export interface ExtractedSlide {
  pageIndex: number;
  textBlocks: ExtractedTextBlock[];
  include: boolean;           // user toggle
  dimensions: { width: number; height: number };
}

export interface ExtractedTextBlock {
  id: string;
  text: string;
  isHeading: boolean;         // detected by font size
  x: number;
  y: number;
  width: number;
  height: number;
}

// Lock state for shuffle mechanic
export interface LockState {
  background: boolean;
  typography: boolean;
  accentColor: boolean;
  layout: boolean;
  graphicElements: boolean;
  contentAngle: boolean;
}

export type AppMode = 'restyle' | 'build';
