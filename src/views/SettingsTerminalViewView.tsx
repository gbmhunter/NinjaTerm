import React from 'react'
import { observer } from 'mobx-react'
import { Form, Input, TextArea, Button, Select, FormProps } from 'semantic-ui-react'
import { Formik } from "formik";
import * as yup from "yup";

import App from '../model/App'
import EditAboutGrid from './EditAboutGrid'


interface IProps {
  app: App
}

const SettingsTerminalViewView = observer((props: IProps) => {

  const { app } = props

  const handleSubmit = (data : FormProps) => {
    console.log(data)
  }

  const userBasic = {
    firstName: 'first',
    lastName: 'last',
    bio: 'blah blah',
  }

  return (
    <div className="vbox" style={{ }}>

<Formik
       initialValues={{ terminalWidth: '', password: '' }}
       validationSchema={yup.object().shape({
        terminalWidth: yup
          .string()
          .required("Terminal width cannot be empty."),
        lastName: yup
          .string()
          .required("Name cannot be empty"),
        bio: yup
          .string()
          .max(1000, "Maximum characters exceed 1000")
          .nullable()
      })}
      //  validate={values => {
      //    const errors = {};
      //    if (!values.email) {
      //      errors.email = 'Required';
      //    } else if (
      //      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
      //    ) {
      //      errors.email = 'Invalid email address';
      //    }
      //    return errors;
      //  }}
       onSubmit={(values, { setSubmitting }) => {
         setTimeout(() => {
           alert(JSON.stringify(values, null, 2));
           setSubmitting(false);
         }, 400);
       }}
     >
       {({
         values,
         errors,
         touched,
         handleChange,
         handleBlur,
         handleSubmit,
         isSubmitting,
         /* and other goodies */
       }) => (
         <Form onSubmit={handleSubmit}>
           <Form.Input
             type="text"
             name="terminalWidth"
             onChange={handleChange}
             onBlur={handleBlur}
             value={values.terminalWidth}
           />
           {errors.terminalWidth && touched.terminalWidth && errors.terminalWidth}
           <Form.Input
             type="password"
             name="password"
             onChange={handleChange}
             onBlur={handleBlur}
             value={values.password}
           />
           {errors.password && touched.password && errors.password}
           <Form.Button type='submit' content='Submit' disabled={isSubmitting} />
         </Form>
       )}
     </Formik>

{/*
      <EditAboutGrid
        editBasicModal={true}
        userBasic={userBasic}
        closeModal={() => {}}
      /> */}
      <span>Terminal Width:</span>
      <Input value={app.settings.terminalWidth} onChange={(_1, data) => { app.settings.setTerminalWidth(data.value) }} />
    </div>
  )
})

export default SettingsTerminalViewView
