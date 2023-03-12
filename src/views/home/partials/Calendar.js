import { Image, Grid } from 'semantic-ui-react';
import React, {useContext,useState, useEffect} from 'react';
import image from './../../../img/dashboard/empty_service.png';
import { useParams } from 'react-router-dom';
const Calendar = () => {


    return (<>

        <div className='contentDashboard'>
        <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
            <Grid.Column>
                <div style={{textAlign:'center'}}>
                    <Image src={image} alt='Sin Servicios' centered size='small'/>
                    <h2 style={{fontWeight:100}}>No cuentas con acceso</h2>
                    <p>Puedes solicitar acceso a la creación de recordartorios con tu administrador.</p>
                </div>
            </Grid.Column>
        </Grid>
        </div>
    </>);
    
}
 
export default Calendar;