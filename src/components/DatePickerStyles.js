import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

export default class DatePickerStyles extends Component {
  static propTypes = {
    daypassColor: PropTypes.string.isRequired,
    eveningpassColor: PropTypes.string.isRequired,
  };

  render() {
    const { daypassColor, eveningpassColor } = this.props;
    const passes = [
      {
        name: 'daypasses',
        color: daypassColor,
      },
      {
        name: 'eveningpasses',
        color: eveningpassColor,
      },
    ];

    const styles = passes
      .map(pass => {
        return `
.SchemaChooser .DayPicker-Day--${pass.name}:not(.DayPicker-Day--selected) {
  color: white !important;
  background-color: ${pass.color} !important;
}
.${pass.name}Button {
  color: white;
  background-color: ${pass.color};
}
  `;
      })
      .join('\n');

    return (
      <Fragment>
        <Helmet>
          <style type="text/css">{styles}</style>
        </Helmet>
      </Fragment>
    );
  }
}
