import {useState} from 'react';

function organizeValues(jsonData) {
  const organizedData = [];

  jsonData.forEach(item => {
      const values = item.values;
      if(!values){
        return [];
      }

      values.forEach((value, index) => {
          if (!organizedData[index]) {
              organizedData[index] = [];
          }

          organizedData[index].push(value);
      });
  });

  return organizedData;
}

const SimpleField = ({ infoField }) => {
  if(!infoField.values){
    return null;
  }
  return (
    <div style={{borderWidth: 1, display: 'flex', border: '1px solid #ccc',}}>
      <div style={{textTransform: 'capitalize', fontWeight: 700, padding: '0.5rem'}}>{infoField.title}</div>
      <div style={{color : infoField.colorText, padding: '0.5rem', flex: '1 1 0%', borderLeftWidth: 1}}>{infoField?.values[0]}</div>
    </div>
  )};

const GroupField = ({ fields,onAddRow,group }) => {
  
  const sortValues = organizeValues(fields);
  
  return <div>
    <table style={{width: '100%'}}>
      <thead>
        <tr>
          {fields.filter(({ status }) => status).map(({ title }, index) => (
            <td key={index} style={{padding: '0.5rem', borderWidth: 1,border: '1px solid #ccc', textTransform: 'capitalize', fontWeight: 700}}><b>{title}</b></td>
          ))}
        </tr>
      </thead>
      <tbody>
          {
            sortValues.map((val, indexField) => {
                return <tr key={val+'-'+indexField}>{val.map((v, indexValue) => {
                  return <td key={val+'-val-'+indexField+indexValue} style={{padding: '0.5rem', borderWidth: 1,border: '1px solid #ccc', textTransform: 'capitalize'}}>{v}</td>
                })}</tr>
              })

          }
      </tbody>
    </table>
  </div>
};

const PreviewBuilder = ({ infoTemplate }) => {
  
  

  const addRow = () => {}

  return (
    <div id="ml01-container">
      <div style={{
        width: '80%',
        margin: '20px auto',
        border: '1px solid #ccc',
        padding: 20,
        marginBottom: 20
      }}>
        <div style={{fontSize: '1.5rem',lineHeight: '2rem', textAlign: 'right'}}>{infoTemplate.title}</div>
        <img src={infoTemplate.logo} alt="Logo" id="logo" style={{marginTop: '1rem',marginBottom: '1rem', maxWidth:'100%'}}/>

        {Object.keys(infoTemplate.fields).map((key) => {
          const fieldData = infoTemplate.fields[key];

          if (fieldData.length === 1 && fieldData[0].status) {
            return <SimpleField key={key} infoField={fieldData[0]} />;
          } else if (fieldData.length > 1) {
            return <GroupField key={key} fields={fieldData} group={key} onAddRow={(group,values) => {
              addRow(group,values);
            }}/>;
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default PreviewBuilder;
