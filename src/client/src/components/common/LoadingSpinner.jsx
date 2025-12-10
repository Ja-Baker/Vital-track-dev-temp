import React from 'react';
import PropTypes from 'prop-types';
import { SPINNER_SIZES } from '../../utils/constants';

function LoadingSpinner({ size = 'md' }) {
  return (
    <div
      className="loading-spinner"
      style={{ width: SPINNER_SIZES[size], height: SPINNER_SIZES[size] }}
    />
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default LoadingSpinner;
