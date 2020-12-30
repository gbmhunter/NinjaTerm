import React, { Component } from "react";
import { Button, Form, Modal, Message, Divider } from "semantic-ui-react";
import { Formik } from "formik";
import * as yup from "yup";

function isEmpty(arg){
  return (
    arg == null || // Check for null or undefined
    arg.length === 0 || // Check for empty String (Bonus check for empty Array)
    (typeof arg === 'object' && Object.keys(arg).length === 0) // Check for empty Object or Array
  );
}

export default class EditAboutGrid extends Component {

  render() {
    const {
      userBasic,
      editBasicModal,
      closeModal
    } = this.props;

    return (
      <Formik
        initialValues={{
          firstName: userBasic.firstName,
          lastName: userBasic.lastName,
          bio: userBasic.bio,
        }}
        validationSchema={yup.object().shape({
          firstName: yup
            .string()
            .required("Name cannot be empty"),
          lastName: yup
            .string()
            .required("Name cannot be empty"),
          bio: yup
            .string()
            .max(1000, "Maximum characters exceed 1000")
            .nullable()
        })}
        onSubmit={(values, actions) => {
          //do your stuff here like api calls
        }}
        render={({
          values,
          errors,
          handleChange,
          handleSubmit,
          isSubmitting,
          dirty,
          setFieldValue
        }) => (
          <Modal open={editBasicModal} size="small">
            <Modal.Header>Your basic details</Modal.Header>
            <Modal.Content scrolling>
              {errors.firstName && <Message error content={errors.firstName} />}
              {errors.lastName && <Message error content={errors.lastName} />}
              {errors.bio && <Message error content={errors.bio} />}

              <Form loading={isSubmitting}>
                <Form.Group inline widths="equal">
                  <Form.Input
                    required
                    label="First Name"
                    fluid
                    type="text"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    error={errors.firstName !== undefined}
                  />
                  <Form.Input
                    required
                    label="Last Name"
                    fluid
                    type="text"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    error={errors.lastName !== undefined}
                  />
                </Form.Group>
                <Form.TextArea
                  label="Bio"
                  type="text"
                  name="bio"
                  value={values.bio}
                  onChange={handleChange}
                  rows={3}
                  error={errors.bio !== undefined}
                />
              </Form>
            </Modal.Content>
            <Modal.Actions open={true}>
              <Button
                onClick={() => (dirty ? closeModal(true) : closeModal(false))}>
                Cancel
              </Button>
              <Button
                primary
                type="submit"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting || !isEmpty(errors) || !dirty}>
                Update
              </Button>
            </Modal.Actions>
          </Modal>
        )}
      />
    );
  }
}
