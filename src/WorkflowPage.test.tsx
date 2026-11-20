import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import WorkflowPage from './WorkflowPage';

describe('WorkflowPage', () => {
  it('renders the stages in pipeline order', () => {
    render(<WorkflowPage onOpenProduct={() => {}} />);
    const titles = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual([
      'Ingest',
      'Prepare',
      'Embed & index',
      'Retrieve',
      'Generate',
      'Evaluate & observe',
      'Serve',
      'Govern',
    ]);
  });

  it('lists every workflow product exactly once', () => {
    const { container } = render(<WorkflowPage onOpenProduct={() => {}} />);
    const names = Array.from(container.querySelectorAll('.wf-item')).map(
      (el) => el.querySelector('.wf-item-name')?.textContent ?? '',
    );
    expect(names).toHaveLength(42);
    expect(new Set(names).size).toBe(names.length);
  });

  it('opens the guide for the tool that was clicked', () => {
    const onOpenProduct = vi.fn();
    render(<WorkflowPage onOpenProduct={onOpenProduct} />);
    screen.getByRole('button', { name: /Docling/ }).click();
    expect(onOpenProduct).toHaveBeenCalledWith('docling');
  });
});
