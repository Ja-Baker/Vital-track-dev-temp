import React from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { formatChartTime, formatTooltipTime } from '../../utils/helpers';

function VitalChart({ data, dataKey, color, label }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="card"
        style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <p className="text-gray">No data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h4 className="mb-3">{label}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            tickFormatter={formatChartTime}
          />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: '8px'
            }}
            labelFormatter={formatTooltipTime}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`${color}20`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

VitalChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    time: PropTypes.string.isRequired,
    value: PropTypes.number
  })),
  dataKey: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
};

export default VitalChart;
