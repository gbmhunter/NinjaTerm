import React from 'react'
import { observer } from 'mobx-react'
import { Form } from 'semantic-ui-react'
import { Formik } from "formik";
import * as yup from "yup";

import App from '../model/App'

interface IProps {
  app: App
}

const SettingsTerminalViewView = observer((props: IProps) => {

  const { app } = props

  return (
    <div className="vbox" style={{ }}>

      <Formik
        initialValues={{ terminalWidth: app.settings.terminalWidth.toString() }}
        validationSchema={yup.object().shape({
          terminalWidth: yup
            .number().integer().positive()
            .test('test less than or equal to', `Number must be less than or equal to 10000.`, (value) => {
              if (value === undefined) throw Error('Value provided to terminal width validation test invalid.')
              return value <= 10000
            })
            .required("Terminal width cannot be empty."),
        })}
        onSubmit={(values, actions) => {
          // console.log('onSubmit() called.')
          // console.log(values)
          app.settings.setTerminalWidth(parseInt(values.terminalWidth, 10))
          actions.resetForm({ values })
          actions.setSubmitting(false)
        }}
      >
        {({
          values,
          errors,
          handleChange,
          handleBlur,
          handleSubmit,
          dirty,
        }) => (
          <Form onSubmit={handleSubmit}>
            <Form.Input
              type="text"
              name="terminalWidth"
              label="Terminal width"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.terminalWidth}
              error={ errors.terminalWidth ? { content: errors.terminalWidth} : null }
            />
            <Form.Button type='submit' content='Apply' disabled={!dirty} />
          </Form>
        )}
      </Formik>
    </div>
  )
})

export default SettingsTerminalViewView
