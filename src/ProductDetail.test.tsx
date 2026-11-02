import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ProductDetail from './ProductDetail';

describe('ProductDetail', () => {
  it('renders product name and category', () => {
    render(
      <ProductDetail
        productId="supabase"
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supabase');
    expect(screen.getByText('Postgres plus auth, storage, realtime and edge functions in one open-source backend. Fast way to get a full backend.')).toBeInTheDocument();
  });

  it('renders the model badge', () => {
    render(
      <ProductDetail
        productId="supabase"
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Both')).toBeInTheDocument();
  });

  it('renders alternatives and close button', () => {
    render(
      <ProductDetail
        productId="supabase"
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Compare with')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
  });

  it('calls onOpenGuide when the full guide button is clicked', () => {
    const onOpenGuide = vi.fn();
    render(
      <ProductDetail
        productId="supabase"
        onSelect={() => {}}
        onClose={() => {}}
        onOpenGuide={onOpenGuide}
      />,
    );
    screen.getByText('Full guide →').click();
    expect(onOpenGuide).toHaveBeenCalledWith('supabase');
  });
});
