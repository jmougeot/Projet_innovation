/**
 * Main Table component entry point
 * 
 * This file exports all table-related components and utilities.
 * The actual implementation has been split into smaller, more maintainable files
 * organized under the ./table/ directory for better code organization.
 */

// Re-export all table components and utilities from the organized structure
export * from './table/index';

// Also export as default for direct imports
import TableComponent from './table/components/TableComponent';
export default TableComponent;
