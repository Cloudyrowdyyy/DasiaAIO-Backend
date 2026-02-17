import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from '../Logo';

describe('Logo Component', () => {
    test('renders logo correctly', () => {
        render(<Logo />);
        const logoElement = screen.getByAltText(/company logo/i);
        expect(logoElement).toBeInTheDocument();
    });

    test('has correct class name', () => {
        render(<Logo />);
        const logoElement = screen.getByAltText(/company logo/i);
        expect(logoElement).toHaveClass('logo');
    });

    test('handles click event', () => {
        const handleClick = jest.fn();
        render(<Logo onClick={handleClick} />);
        const containerElement = screen.getByAltText(/company logo/i).closest('.logo-container');
        if (containerElement) containerElement.click();
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});