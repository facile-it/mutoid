import * as React from 'react'
import { render } from 'react-dom'
import { AppInitializer } from './App'

render(
    <React.StrictMode>
        <AppInitializer />
    </React.StrictMode>,
    document.getElementById('root')
)
