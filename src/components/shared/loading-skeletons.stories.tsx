import type { Meta, StoryObj } from '@storybook/react';
import {
  CardSkeleton,
  DetailSkeleton,
  FormSkeleton,
  GridLoading,
  ListLoading,
  PageSkeleton,
  TableLoading,
} from './loading-skeletons';

const meta = {
  title: 'Shared/LoadingSkeletons',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {
  render: () => (
    <div style={{ width: 800, padding: 24 }}>
      <GridLoading count={9} columns={3} />
    </div>
  ),
};

export const GridTwoColumns: Story = {
  render: () => (
    <div style={{ width: 800, padding: 24 }}>
      <GridLoading count={4} columns={2} height="h-48" />
    </div>
  ),
};

export const List: Story = {
  render: () => (
    <div style={{ width: 800, padding: 24 }}>
      <ListLoading count={6} />
    </div>
  ),
};

export const Table: Story = {
  render: () => (
    <div style={{ width: 800, padding: 24 }}>
      <TableLoading rows={5} columns={4} />
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div style={{ width: 320, padding: 24 }}>
      <CardSkeleton />
    </div>
  ),
};

export const CardWithoutImage: Story = {
  render: () => (
    <div style={{ width: 320, padding: 24 }}>
      <CardSkeleton withImage={false} />
    </div>
  ),
};

export const Form: Story = {
  render: () => (
    <div style={{ width: 800, padding: 24 }}>
      <FormSkeleton fieldCount={5} />
    </div>
  ),
};

export const Page: Story = {
  render: () => (
    <div style={{ width: 1000, padding: 0 }}>
      <PageSkeleton />
    </div>
  ),
};

export const Detail: Story = {
  render: () => (
    <div style={{ width: 1000, padding: 24 }}>
      <DetailSkeleton />
    </div>
  ),
};
