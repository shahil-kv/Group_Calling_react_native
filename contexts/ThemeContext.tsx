import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';

// Define the shape of the context value
interface ThemeContextType {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

// Create context with a default value
const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => { },
});

// Define props for ThemeProvider
interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const colorScheme = useColorScheme();
    const [theme, setTheme] = useState<'light' | 'dark'>(colorScheme || 'light');

    // Update theme when system color scheme changes
    useEffect(() => {
        setTheme(colorScheme || 'light');
    }, [colorScheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <View
                className={`flex-1 bg-background ${theme === 'dark' ? 'dark' : ''}`}
            >
                {children}
            </View>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);