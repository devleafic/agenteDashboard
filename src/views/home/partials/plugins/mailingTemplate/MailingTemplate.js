import {useState} from 'react';
import { Select, ListItem, List, Button, ModalHeader,
  ModalDescription,
  ModalContent,
  ModalActions,
  Header,
  Input,
  Icon,
  Modal, } from 'semantic-ui-react'

import PreviewBuilder from './PreviewBuilder';
import _ from 'lodash';

export default function MailingTemplate({folio, setMessageToSend}) {
  
  const infoService = folio.folio.service;
  const infoPlugin = infoService.plugins.find((p) => {return p.plugin === 'mailingTemplate'});
  
  const [categorieSelected, setCategorieSelected] = useState(null);
  const [listTemplates, setListTemplates] = useState([]);
  const [templateSelected, setTemplateSelected] = useState(null);

  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState({});

  const groupField = (fs, i, group) => {
     // Campo, Indice Campo, Grupo
    const sortedValues = organizeValues(fs);
    
    
    return <div key={group} style={{marginTop:10}}>
      {
        fs.length > 1 && fs.map((f, index) => {
          return <Input key={`blank-${group}-${index}`} label={f.title}
            value={formValues[group] && formValues[group][index] ? formValues[group][index] : ''}
            style={{ marginRight: 10, marginBottom: 10}}
            type={f.type}
            onChange={(e, {value}) => {
              setFormValues({
                ...formValues,
                [group]: {
                  ...formValues[group],
                  [index]: value
                }
              })
            }}
          />
          
        })
      }
      { fs.length > 1 &&  <Button color='green' style={{marginLeft:5}}
        onClick={() => {
          addValuesToGroup(group);
        }}
        >Agregar Valores</Button>}
      <div>
        {Array.from({ length: fs.length === 1 ? 1 : fs[0].values?.length }).map((_, iteration) => (
          <div key={`iteration-${group}-${iteration}`} style={{ display: 'flex' }}>
            {fs.map((f, index) => (
              <div key={`blank-${group}-${iteration}-${index}`} style={{ marginRight: 10, marginBottom: 10}}>
                <Input
                  type={f.type}
                  label={f.title}
                  value={f.values[iteration]}
                  onChange={(e, { value }) => {
                    handleInputChange(group, index, value, iteration);
                  }}
                />
              </div>
            ))}
            {fs.length > 1 && <Button icon color='default' style={{marginLeft:5}} size='tiny' onClick={()=> {
              // Eliminamos valores de cada campo del grupo de la variable formValues
              removeValues(group, iteration)
            }}><Icon name='trash alternate' /></Button>}
          </div>
        ))}
      </div>
    </div> 
  }

  function organizeValues(jsonData) {
    if(!jsonData){return []}
    const organizedData = [];

    jsonData.forEach(item => {
        const values = item.values;
      if(values){
        values.forEach((value, index) => {
          if (!organizedData[index]) {
              organizedData[index] = [];
          }

          organizedData[index].push(value);
        });
      }
    });

    return organizedData;
  }

  // Grupo, Indice del Campo, Valor, Indice del Valor
  const handleInputChange = (group, index, value, indexValue) => {
    
    // Actualizar el estado templateSelected con la nueva información
    const updatedTemplate = { ...templateSelected };

    if (!updatedTemplate.fields[group]) {
      updatedTemplate.fields[group] = [];
    }

    updatedTemplate.fields[group][index].values[indexValue] = value;

    setTemplateSelected(updatedTemplate);
  };

  const renderForm = (fields) => {
    if(!fields){return null}
    return <div>
      {Object.keys(fields).map((xGroup, indexField) => {
          // Campo, Indice Campo, Grupo
          return groupField(fields[xGroup] ,indexField, xGroup);
      })}
    </div>
  }

  const addValuesToGroup = (group) => {
    
    const updatedTemplate = { ...templateSelected };
    const fields = updatedTemplate.fields[group];
    
    // Agregamos un nuevo valor a cada campo del grupo de la variable formValues
    const clearGroup = [];
    Object.keys(formValues[group]).map((value, index) => {
      fields[value].values.push(formValues[group][value]);
    });

    setTemplateSelected({
      ...updatedTemplate,
      fields: {
        ...updatedTemplate.fields,
        [group]: fields
      }
    });

    setFormValues({
      ...formValues,
      [group]: clearGroup
    });
  }

  const removeValues = (group, index) => {
    
    const updatedTemplate = { ...templateSelected };
    const fields = updatedTemplate.fields[group];
    
    fields.map((value, i) => {
      fields[i].values.splice(index, 1);
    });

    setTemplateSelected({
      ...updatedTemplate,
      fields: {
        ...updatedTemplate.fields,
        [group]: fields
      }
    });

    // setFormValues({
    //   ...formValues,
    //   [group]: clearGroup
    // });
  }


  return (<div>
    <div>Selecciona una Categoría</div>
    <Select placeholder='Selecciona una categoría'
      value={categorieSelected}
      options={infoPlugin.dataConfig.categories.map((xCategorie) => {
      return { key: xCategorie._id , value: xCategorie._id, text: xCategorie.label }
    })} onChange={(e, {value, id}) => {
      setCategorieSelected(value);
      const list = infoPlugin.dataConfig.listTemplates.filter((xTemplate) => {
        return xTemplate.category === value;
      });
      setListTemplates(list);
    }}/>
    <div>
      <div style={{marginTop : 10}}>Selecciona una plantilla</div>
      <List divided>
        {listTemplates.map((xTemplate) => {
          return <ListItem key={xTemplate._id}>
            <Button onClick={() => {
              
              setTemplateSelected(_.cloneDeep(xTemplate));
              setOpen(true);
            } }>{xTemplate.title}</Button>
          </ListItem>
        })}
      </List>
    </div>


    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
    >
      <ModalHeader>{`Enviar plantilla "${templateSelected?.title}"`}</ModalHeader>
      <ModalContent>
        
        <ModalDescription>
          <Header>Campos</Header>
          {
            renderForm(templateSelected?.fields)
          }
          <Header>Mail</Header>
          <div>
            <PreviewBuilder infoTemplate={templateSelected} />
          </div>
        </ModalDescription>
      </ModalContent>
      <ModalActions>
        <Button color='black' onClick={() => {
          setTemplateSelected(null)
          setOpen(false)
        }}>Cancelar</Button>
        <Button
          content="Generar HTML"
          labelPosition='right'
          icon='checkmark'
          onClick={() => {
            const containerElement = document.getElementById('ml01-container');
            if (containerElement) {
                // Obtener el contenido del elemento
                const contenido = containerElement.innerHTML;
          
                // Hacer algo con el contenido
                setMessageToSend(contenido);
              }
            setOpen(false)
          }}
          positive
        />
      </ModalActions>
    </Modal>
  </div>)
  
}