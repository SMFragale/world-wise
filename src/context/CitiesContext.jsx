import { createContext, useEffect, useContext, useReducer } from "react";

const URL = 'http://localhost:9000'
const CitiesContext = createContext();

function reducer(state, action) {
	switch(action.type) {
		case 'loading':
			return {...state, isLoading: true}
		case 'cities/loaded':
			return {...state, isLoading: false, cities: action.payload}
		case 'city/loaded':
			return {...state, isLoading: false, currentCity: action.payload}
		case 'city/created':
			return {...state, cities: [...state.cities, action.payload], isLoading: false, currentCity: action.payload}
		case 'city/deleted':
			return {...state, cities: state.cities.filter(city => city.id != action.payload), isLoading: false}
		case 'error':
			return {...state, isLoading: false, error: action.payload}
		default:
			throw new Error('Unknown action type')
	}
}

const initialState = {
	cities: [],
	isLoading: false,
	currentCity: {},
	error: ''
}

function CitiesProvider({children}) {
	const [state, dispatch] = useReducer(reducer, initialState);
	const { cities, isLoading, currentCity } = state;
    
	useEffect( function() {
		const fetchCities = async () => {
			try {
				dispatch({type: 'loading'});
				const res = await fetch(`${URL}/cities`)
				const data = await res.json();
				dispatch({type: 'cities/loaded', payload: data});
			}
			catch {
				dispatch({type: 'error', payload: 'There was an error loading the cities...'})
			}
		} 
		fetchCities();
	}, [])

	async function getCity(id) {
		if(Number(id) === currentCity.id) return;
		const fetchCities = async () => {
			try {
				dispatch({type: 'loading'});
				const res = await fetch(`${URL}/cities/${id}`)
				const data = await res.json();
				dispatch({type: 'city/loaded', payload: data})
			}
			catch(error) {
				dispatch({type: 'error'})
			}
		} 
		fetchCities();
	}

	async function createCity(newCity) {
		try {
			dispatch({type: 'loading'})
			const res = await fetch(`${URL}/cities` , { method: 'POST', body: JSON.stringify(newCity), headers: { "Content-Type" : "application/json" } })
			const data = await res.json();
			dispatch({type: 'city/created', payload: data})
		}
		catch(error) {
			dispatch({type: 'error', payload: 'There was an error creating the city'})
		}
	}

	async function deleteCity(cityId) {
		try {
			dispatch({type: 'loading'})
			const res = await fetch(`${URL}/cities/${cityId}` , { method: 'DELETE' })
			const data = await res.json();
			if(data)
				dispatch({type: 'city/deleted', payload: cityId})
		}
		catch(error) {
			dispatch({type: 'error', payload: 'There was an error deleting the city'})
		}
	}

    return (
        <CitiesContext.Provider value={{
            cities,
            isLoading,
			currentCity,
			getCity,
			createCity,
			deleteCity
        }}>
            {children}
        </CitiesContext.Provider>
    )
}

function useCities() {
    const context = useContext(CitiesContext)
    if(context === undefined) throw new Error("Cities context is not available in the current component")
    return context;
}

export { CitiesProvider, useCities }