// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom'
import useUrlPosition from "../hooks/useUrlPosition"; 
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";


import styles from "./Form.module.css";
import Button from "./Button";
import ButtonBack from './ButtonBack';
import Message from './Message';
import Spinner from './Spinner'
import { useCities } from "../context/CitiesContext";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const GEOURL = "https://api.bigdatacloud.net/data/reverse-geocode-client"

function Form() {
  const navigate = useNavigate();
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [lat, lng] = useUrlPosition();
  const [geoCodingError, setGeoCodingError] = useState('')

  const [isLoadingGeoCoding, setIsLoadingGeoCoding] = useState(false)

  const [emoji, setEmoji] = useState("")

  const { createCity, isLoading } = useCities();
  
  useEffect(() => {
    async function fetchCityData() {

      if(!lat || !lng) {
        return;
      }

      try {
        setIsLoadingGeoCoding(true);
        setGeoCodingError('');
        const res = await fetch(`${GEOURL}?latitude=${lat}&longitude=${lng}`)
        const data = await res.json();

        if(!data.countryCode) throw new Error("Not a city")

        setCityName(data.city)
        setCountry(data.countryName)
        setEmoji(convertToEmoji(data.countryCode))
      } catch(err) {
        setGeoCodingError(err.message)
      } finally {
        setIsLoadingGeoCoding(false);
      }
    }
    fetchCityData();

  }, [lat, lng])

  function handleSubmit(e) {
    e.preventDefault();

    if(!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng }
    }

    createCity(newCity);
    navigate('/app/cities')
  }

  if(isLoadingGeoCoding) {
    return <Spinner />;
  }

  if(!lat || !lng) {
    return <Message message='Start by clicking somewhere on the map' />
  }

  if (geoCodingError) {
    return <Message message={geoCodingError} /> 
  }

  return (
    <form className={`${styles.form} ${isLoading ? styles.loading : ''}`} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <label htmlFor="cityName">City Name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        {<span className={styles.flag}>{emoji}</span>}
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        <DatePicker id="date" onChange={date => setDate(date)} selected={date} dateFormat={'dd/MM/yyyy'}/>
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type='primary'>Add</Button>
        <ButtonBack />
      </div>
    </form>
  );
}

export default Form;
