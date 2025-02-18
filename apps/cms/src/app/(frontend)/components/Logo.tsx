import React from 'react';

import styles from '../page.module.css';

const CdwrCloud = ({ className = '', size = 40, ...props }) => {
  const viewBoxWidth = 10.583617;
  const viewBoxHeight = 7.4375901;
  const aspectRatio = viewBoxWidth / viewBoxHeight;
  const width = size;
  const height = size / aspectRatio;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className={className}
      {...props}
    >
      <g transform="translate(-99.483333, -144.99134)">
        <path d="m 108.42445,147.96297 c -0.14249,-0.0413 -0.29005,-0.0694 -0.44235,-0.0818 -0.23675,-1.40078 -1.46858,-2.46282 -2.91535,-2.46282 -1.11196,0 -2.11944,0.61377 -2.63,1.60155 -4.3e-4,5.5e-4 -8.2e-4,9.5e-4 -8.2e-4,0.001 -0.21884,0.42101 -0.32935,0.87739 -0.32935,1.35559 0,0.11811 -0.0955,0.21318 -0.21333,0.21318 -0.11768,0 -0.21318,-0.0951 -0.21318,-0.21318 0,-0.41812 0.0737,-0.82159 0.22049,-1.20333 0.0452,-0.11864 0.0981,-0.23548 0.15737,-0.34974 0.0187,-0.0364 0.038,-0.0722 0.058,-0.10746 0.60013,-1.06691 1.71979,-1.72462 2.95081,-1.72462 0.85823,0 1.67721,0.32243 2.30501,0.9073 0.58692,0.54681 0.95677,1.27494 1.05269,2.064" />
        <path d="m 108.4399,148.11745 c 0.009,0.11769 -0.0794,0.2201 -0.19664,0.22864 -0.0175,0.001 -0.035,4e-4 -0.0513,-0.003 -0.008,-0.002 -0.0157,-0.003 -0.0234,-0.005 -4e-4,0 -8.2e-4,0 -0.001,-4.2e-4 -0.0828,-0.0244 -0.14633,-0.0969 -0.15268,-0.18849 -0.007,-0.0906 -0.0179,-0.18013 -0.0325,-0.26832 0.1523,0.0124 0.29987,0.0405 0.44235,0.0818 0.006,0.0513 0.0116,0.1028 0.0155,0.15448" />
        <path d="m 110.06667,150.15076 c 0,1.25606 -1.02197,2.27817 -2.27817,2.27817 h -5.44519 c -1.57689,0 -2.859977,-1.2839 -2.859977,-2.86177 0,-1.50566 1.146527,-2.73484 2.632607,-2.85087 -0.02,0.0353 -0.0393,0.0711 -0.058,0.10746 -0.0592,0.11426 -0.11217,0.2311 -0.15737,0.34974 -1.14102,0.20726 -1.990716,1.19768 -1.990716,2.39367 0,1.34278 1.091956,2.43512 2.433476,2.43512 h 5.44519 c 1.02111,0 1.85166,-0.83079 1.85166,-1.85152 0,-0.88251 -0.62026,-1.62264 -1.44819,-1.80728 -0.008,-0.002 -0.0157,-0.003 -0.0234,-0.005 -4e-4,0 -8.2e-4,0 -10e-4,-4.2e-4 -0.12248,-0.0256 -0.24913,-0.0388 -0.37881,-0.0388 -1.02073,0 -1.85113,0.83054 -1.85113,1.85166 0,0.11769 -0.0956,0.21318 -0.21333,0.21318 -0.11807,0 -0.21332,-0.0955 -0.21332,-0.21318 0,-1.25621 1.02168,-2.27817 2.27778,-2.27817 0.0653,0 0.12968,0.002 0.1936,0.009 0.1523,0.0124 0.29987,0.0405 0.44235,0.0818 0.94781,0.27563 1.64222,1.15207 1.64222,2.18779" />
        <path d="m 102.21419,148.66013 c -0.36352,0 -0.65925,0.29588 -0.65925,0.65927 0,0.3635 0.29573,0.65924 0.65925,0.65924 0.36339,0 0.65912,-0.29574 0.65912,-0.65924 0,-0.36339 -0.29573,-0.65927 -0.65912,-0.65927 z m 0,1.74516 c -0.59876,0 -1.08576,-0.48715 -1.08576,-1.08589 0,-0.59863 0.487,-1.08578 1.08576,-1.08578 0.59862,0 1.08578,0.48715 1.08578,1.08578 0,0.59874 -0.48716,1.08589 -1.08578,1.08589" />
        <path d="m 105.66093,150.40529 c -0.27256,0 -0.49428,0.22172 -0.49428,0.49417 0,0.27255 0.22172,0.49428 0.49428,0.49428 0.27259,0 0.49431,-0.22173 0.49431,-0.49428 0,-0.27245 -0.22172,-0.49417 -0.49431,-0.49417 z m 0,1.41495 c -0.50765,0 -0.92079,-0.41299 -0.92079,-0.92078 0,-0.50768 0.41314,-0.92082 0.92079,-0.92082 0.50782,0 0.92082,0.41314 0.92082,0.92082 0,0.50779 -0.413,0.92078 -0.92082,0.92078" />
        <path d="m 108.06218,152.41062 c -0.11783,0 -0.21332,-0.0955 -0.21332,-0.21319 v -1.56891 c 0,-0.11782 0.0955,-0.21332 0.21332,-0.21332 0.11769,0 0.21319,0.0955 0.21319,0.21332 v 1.56891 c 0,0.11769 -0.0955,0.21319 -0.21319,0.21319" />
        <path d="m 104.5446,146.70179 c -0.11783,0 -0.21332,-0.0955 -0.21332,-0.21329 v -1.2138 c 0,-0.11783 0.0955,-0.21333 0.21332,-0.21333 0.11783,0 0.21332,0.0955 0.21332,0.21333 v 1.2138 c 0,0.11779 -0.0955,0.21329 -0.21332,0.21329" />
        <path d="m 108.06218,149.38153 c -0.28497,0 -0.51692,0.23181 -0.51692,0.51692 0,0.28498 0.23195,0.51675 0.51692,0.51675 0.28498,0 0.51675,-0.23177 0.51675,-0.51675 0,-0.28511 -0.23177,-0.51692 -0.51675,-0.51692 z m 0,1.46032 c -0.5202,0 -0.9434,-0.42319 -0.9434,-0.9434 0,-0.5202 0.4232,-0.94343 0.9434,-0.94343 0.52021,0 0.9434,0.42323 0.9434,0.94343 0,0.52021 -0.42319,0.9434 -0.9434,0.9434" />
        <path d="m 104.5446,146.70179 c -0.28914,0 -0.52437,0.23523 -0.52437,0.52451 0,0.2891 0.23523,0.52433 0.52437,0.52433 0.2891,0 0.52433,-0.23523 0.52433,-0.52433 0,-0.28928 -0.23523,-0.52451 -0.52433,-0.52451 z m 0,1.47535 c -0.52437,0 -0.95098,-0.42651 -0.95098,-0.95084 0,-0.52451 0.42661,-0.95098 0.95098,-0.95098 0.52433,0 0.95098,0.42647 0.95098,0.95098 0,0.52433 -0.42665,0.95084 -0.95098,0.95084" />
      </g>
    </svg>
  );
};

export default function Logo() {
  return (
    <div className={styles.logo}>
      <CdwrCloud size={60} className={styles.logoSvg} />
    </div>
  );
}
