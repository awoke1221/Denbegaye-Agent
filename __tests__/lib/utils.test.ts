import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('combines class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles conditional classes', () => {
    expect(cn('bg-red-500', { 'text-white': true, 'font-bold': false })).toBe(
      'bg-red-500 text-white'
    );
  });

  it('merges conflicting Tailwind classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles arrays of classes', () => {
    expect(cn(['bg-red-500', 'text-white'], 'font-bold')).toBe('bg-red-500 text-white font-bold');
  });

  it('removes duplicates', () => {
    expect(cn('bg-red-500', 'bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles undefined and null values', () => {
    expect(cn('bg-red-500', undefined, null, 'text-white')).toBe('bg-red-500 text-white');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
