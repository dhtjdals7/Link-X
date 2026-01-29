import React, { createContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const ConfigContext = createContext<any>(null);

const initialState = {
    fontFamily: 'Public Sans',
    borderRadius: 8,
    outlinedFilled: true,
    navType: 'light',
    presetColor: 'default',
    locale: 'en'
};

interface ConfigProviderProps {
    children: ReactNode;
}

export default function ConfigProvider({ children }: ConfigProviderProps) {
    const [config, setConfig] = useLocalStorage('mantis-config', initialState);

    const onChangeConfig = (key: string, value: any) => {
        setConfig({ ...config, [key]: value });
    };

    return (
        <ConfigContext.Provider value={{ ...config, onChangeConfig }}>
            {children}
        </ConfigContext.Provider>
    );
}

export { ConfigContext };