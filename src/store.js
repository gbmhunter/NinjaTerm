import { configureStore, createStore } from '@reduxjs/toolkit'
import countReducer from './App'

export default configureStore({
  reducer: countReducer
})
