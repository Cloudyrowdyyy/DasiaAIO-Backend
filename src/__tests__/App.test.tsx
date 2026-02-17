import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
    test('renders welcome message', () => {
        render(<App />);
        const linkElement = screen.getByText(/welcome/i);
        expect(linkElement).toBeInTheDocument();
    });

    test('renders login page by default', () => {
        render(<App />);
        // App should render LoginPage when not logged in
        expect(screen.getByText(/email, username, or phone number/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    });

    test('renders with agency name', () => {
        render(<App />);
        // Check that the agency name is displayed
        expect(screen.getByText(/davao security/i)).toBeInTheDocument();
    });
});