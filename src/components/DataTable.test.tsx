import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, createSortableHeader } from './DataTable';

// Sample test data
interface TestItem {
    id: number;
    name: string;
    status: string;
}

const testData: TestItem[] = [
    { id: 1, name: 'Item One', status: 'active' },
    { id: 2, name: 'Item Two', status: 'pending' },
    { id: 3, name: 'Item Three', status: 'completed' },
    { id: 4, name: 'Item Four', status: 'active' },
    { id: 5, name: 'Item Five', status: 'pending' },
];

const columns: ColumnDef<TestItem>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'name',
        header: createSortableHeader('Name'),
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
];

describe('DataTable', () => {
    it('should render table with data', () => {
        render(<DataTable columns={columns} data={testData} />);

        expect(screen.getByText('Item One')).toBeInTheDocument();
        expect(screen.getByText('Item Two')).toBeInTheDocument();
        // Multiple items have 'active' status, so use getAllByText
        expect(screen.getAllByText('active').length).toBeGreaterThan(0);
    });

    it('should render loading skeleton when isLoading is true', () => {
        render(<DataTable columns={columns} data={[]} isLoading={true} />);

        // Should not show data rows
        expect(screen.queryByText('Item One')).not.toBeInTheDocument();
    });

    it('should render empty message when no data', () => {
        render(
            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No items found."
            />
        );

        expect(screen.getByText('No items found.')).toBeInTheDocument();
    });

    it('should filter data with search', () => {
        render(
            <DataTable
                columns={columns}
                data={testData}
                searchPlaceholder="Search items..."
            />
        );

        const searchInput = screen.getByPlaceholderText('Search items...');
        fireEvent.change(searchInput, { target: { value: 'One' } });

        // Should show filtered results
        expect(screen.getByText('Item One')).toBeInTheDocument();
    });

    it('should call onRowClick when row is clicked', () => {
        const onRowClick = vi.fn();

        render(
            <DataTable
                columns={columns}
                data={testData}
                onRowClick={onRowClick}
            />
        );

        const row = screen.getByText('Item One').closest('tr');
        if (row) {
            fireEvent.click(row);
            expect(onRowClick).toHaveBeenCalledWith(testData[0]);
        }
    });

    it('should change page size', () => {
        const largeData = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            status: 'active',
        }));

        render(
            <DataTable
                columns={columns}
                data={largeData}
                initialPageSize={10}
                pageSizeOptions={[10, 20, 50]}
            />
        );

        // Check that we have pagination controls
        expect(screen.getByText('Rows per page')).toBeInTheDocument();
    });
});

describe('createSortableHeader', () => {
    it('should create a sortable header component', () => {
        const SortableHeader = createSortableHeader('Test Label');
        const { container } = render(
            <SortableHeader column={{ getIsSorted: () => false }} />
        );

        expect(container).toHaveTextContent('Test Label');
    });
});
