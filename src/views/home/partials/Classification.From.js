import React from 'react';
import { Form, Label } from 'semantic-ui-react';

const ClassificationForm = ({infoForm}) => {
    const renderForm = (form) => {
        {/*const formFiltered = form.filter((x) => {
            return x.status === true
        });*/}
        const render = form.filter((x) =>{return x.status}).map((x) => {
            switch(x.rtype){
                case 'text':
                    return (<Form.Field  width={6}>
                    <label>{x.label} {x.require && <Label size='mini' color='red' basic pointing='left'>Obligatorio</Label>}</label>
                    <input placeholder={x.lanel} type='text'/>
                  </Form.Field>)
                break;
                case 'number':
                    return (<Form.Field  width={6}>
                    <label>{x.label} {x.require && <Label size='mini' color='red' basic pointing='left'>Obligatorio</Label>}</label>
                    <input placeholder={x.lanel} type='number'/>
                  </Form.Field>)
                break;
                default : 
                    return 'Item no soportado'
                    break
            }
            
        })

        return render;
    }
    return ( <>{infoForm && <Form>
        <p>Ingrese los siguientes datos del formulario.</p>
        {renderForm(infoForm.form)}
        </Form>}</> );
}
 
export default ClassificationForm;