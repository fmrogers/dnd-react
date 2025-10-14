'use client';

import clsx from 'clsx';
import React from 'react';

export interface DraggableHandleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  className?: string;
  pathClassName?: string;
}
export const DraggableHandle: React.FC<DraggableHandleIconProps> = ({
  size = 24,
  color,
  className,
  style,
  pathClassName,
  ...svgProps
}) => {
  const mergedStyle = color ? { color, ...(style || {}) } : style;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={svgProps['aria-label'] ? undefined : true}
      focusable="false"
      className={clsx('inline-block', className)}
      style={mergedStyle}
      {...svgProps}
    >
      <path
        className={pathClassName}
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 9h16v2H4zm16 6H4v-2h16z"
      />
    </svg>
  );
};

export default DraggableHandle;
