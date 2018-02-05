import React from 'react';
import PropTypes from 'prop-types';

import TableRow from './TableRow';
import { SortDirection } from './constants';
import { getNestedValue } from './utils';


/**
 * Wrapper responsible for sorting rows in <TableBody />.
 * Rows are sorted based on `sortingCriteria` and `sortDirection`.
 * 
 * `sortingCriteria` can be either a `function` or a `string`.
 *
 * TODO incorporate this logic into <TableBody /> and remove this component?
 * Is there a better way of modularizing this so `props.rows` is available
 * for different contexts? (e.g. only rendering rows that are in the viewport)
 */
class RowSorterWrapper extends React.Component {
  constructor(props) {
    super(props);

    /*
     * Key: <TableRow /> key
     * Value: corresponding <TableRow /> element
     *
     * @type {Object<string, React.Element>}
     */
    this._unorderedRowsMap = {};

    /*
     * Key: sortingCriteria string
     * Value: array of <TableRow /> keys in sorted order
     *
     * @type {Object<string, string[]>}
     */
    this._orderedRowsMap = {};
  }

  componentWillMount() {
    for (let rowIndex = 0; rowIndex < this.props.rows.length; rowIndex++) {
      const row = this.props.rows[rowIndex];
      this._unorderedRowsMap[row.key] = row;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sortingCriteria &&
        this.props.sortingCriteria !== nextProps.sortingCriteria) {
      // If there was a sortingCriteria change, construct the set of ordered rows to be used
      this._constructSortedRows(nextProps.sortingCriteria);
    }
  }

  _constructSortedRows(sortingCriteria) {
    // Check if we have already sorted this array
    const sortingCriteriaKey = this._getSortingCriteriaKey(sortingCriteria);
    if (this._orderedRowsMap[sortingCriteriaKey]) {
      // TODO check if array has to be resorted (new rowProp values, additions, deletions)
      return;
    }

    // Otherwise sort the array and cache the result
    const unorderedRows = Object.values(this._unorderedRowsMap);
    let sorted;

    switch(typeof sortingCriteria) {
      case 'function':
        sorted = unorderedRows.sort((a, b) => sortingCriteria(a.props.rowProps, b.props.rowProps));
        break;
      case 'string':
        sorted = unorderedRows.sort((a, b) => {
          const aVal = getNestedValue(a.props.rowProps, sortingCriteria);
          const bVal = getNestedValue(b.props.rowProps, sortingCriteria);

          if (aVal > bVal) {
            return 1;
          }
          if (aVal < bVal) {
            return -1;
          }
          return 0;
        });
        break;
      default:
        // This shouldn't happen
        throw new Error(
          `'sortingCriteria' should be of type 'function' or 'string',` +
          `received a ${typeof sortingCriteria}`
        );
    }

    this._orderedRowsMap[sortingCriteriaKey] = sorted.map(row => row.key);
  }

  _getSortingCriteriaKey(sortingCriteria) {
    switch(typeof sortingCriteria) {
      case 'function':
        return sortingCriteria.name;
      case 'string':
        return sortingCriteria;
      default:
        // This shouldn't happen
        throw new Error(
          `'sortingCriteria' should be of type 'function' or 'string',` +
          `received a ${typeof sortingCriteria}`
        );
    }
  }

  _getOrderedRowsBySortingCriteria(sortingCriteria) {
    const sortingCriteriaKey = this._getSortingCriteriaKey(sortingCriteria);
    return this._orderedRowsMap[sortingCriteriaKey].map(rowKey => this._unorderedRowsMap[rowKey]);
  }

  render() {
    switch(this.props.sortDirection) {
      case SortDirection.ASC:
        return this.props.render(this._getOrderedRowsBySortingCriteria(this.props.sortingCriteria));
      case SortDirection.DESC:
        return this.props.render(this._getOrderedRowsBySortingCriteria(this.props.sortingCriteria).reverse());
      default:
        return this.props.render(Object.values(this._unorderedRowsMap));
    }
  }
}

RowSorterWrapper.propTypes = {
  /**
   *
   */
  render: PropTypes.func.isRequired,

  /**
   *
   */
  rows: props => {
    React.Children.toArray(props.rows).forEach(child => {
      if (child.type !== TableRow) {
        return new Error('`RowSorterWrapper` only accepts children of type `TableRow`');
      }
    });
  },

  /**
   *
   */
  sortDirection: PropTypes.oneOf([
    SortDirection.ASC,
    SortDirection.DESC,
  ]),

  /**
   *
   */
  sortingCriteria: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]),
};

RowSorterWrapper.defaultProps = {
  sortDirection: null,
  sortingCriteria: null,
};


export default RowSorterWrapper;
