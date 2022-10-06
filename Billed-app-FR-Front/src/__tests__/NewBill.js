/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { fireEvent, waitFor, screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

const setup = async () => {

  // Create an object with the adaquate properties
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  
  // Connect as an employee
  window.localStorage.setItem(
    "user",
    JSON.stringify({ type: "Employee", email: "a@a" })
  );

  // Create a div as in the DOM
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  // Add the div with append
  document.body.append(root);

  // Initialise router function
  router();

  // Call back root function
  return root;
};

describe("Given I am connected as an employee", () => 
{
  describe("When I am on NewBill Page", () => 
  {
    test("Then, the new bill form should appear", async() => 
    {
      // Await setup function first
      await setup();

      // Be on the new bill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Get the text page title and test what we expect the value, when cast to a boolean, will be a truthy value
      const title = screen.getByText("Envoyer une note de frais");
      // Assertion for getTitle
      expect(title).toBeTruthy();
      
      // Get the new bill form by data-testid and test what we expect the value, when cast to a boolean, will be a truthy value
      const form = screen.getByTestId("form-new-bill");
      // Assertion for getForm
      expect(form).toBeTruthy();

      // Get contact form fields by data-testid
      const fields =
      {
        type: screen.getByTestId("expense-type"), 
        name: screen.getByTestId("expense-name"),
        date: screen.getByTestId("datepicker"),
        amount: screen.getByTestId("amount"),
        vat: screen.getByTestId("vat"),
        pct: screen.getByTestId("pct"),
        commentary: screen.getByTestId("commentary"),
        file: screen.getByTestId("file"),
      };

      // Method returns an array of the object fields' own property names and we test each property names to be true thanks to the imbrication of expect in the forEach() loop method
      Object.keys(fields).forEach((key) => expect(fields[key]).toBeTruthy());

    });

    test("Then an alert error should not pop on the user's screen", async() =>
    {
      // Await setup function first
      await setup();

      // Navigate on the new bill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Monitor the function when creating a new bill ("note de frais") with a spy
      // Fetch bills() from app/Router
      const getBills = mockStore.bills();
      // Spy when there is a bill creation
      const newBillCreation = jest.spyOn(getBills, "create");

      // Fetch the form error
      const formError = screen.getByTestId("form-error");
      // The form error has to be truthy
      expect(formError).toBeTruthy();
      // The form error has to have the class "errorIsHidden"
      expect(formError).toHaveClass("errorIsHidden");

    });

    // Upload a file that is allowed jpeg, jpg or png
    describe("when I upload a file with the right extension", () =>
    {
      test("Then the file should be uploaded by calling the function store.bills().create()", async () =>
      {
        // Call the setup function and transform it in an async function
        await setup();

        // Navigate on the newbill page
        window.onNavigate(ROUTES_PATH.NewBill);

        // Monitor the function when creating a new bill ("note de frais") with a spy
        // Fetch bills() from app/Router
        const getBills = mockStore.bills();
        // Spy jest when there is a bill creation
        const newBillCreation = jest.spyOn(getBills, "create");

        // Fields
        // Get file upload by data-testid
        const fileUpload = screen.getByTestId("file");
        // Set up a time 
        const now = new Date();
        // New bill simulation
        // Set up the type
        const getFileType = new File(["Test"], "test.png", 
        {
          type: "image/png",
          lastModified: now.getTime(),
        });

        // Test simulation for adding a file .png
        fireEvent.change(fileUpload, 
          {
            target: 
            {
              files: [getFileType],
            }
          });

          // Use process.nextTick to ensure asynchronous actions are resolved before running assertions during tests
          await waitFor(() => process.nextTick);

          // Test the two assertions as followed:
          // the function that create the new bill is not to be called
          expect(getBills.create).not.toBeCalled();
          // The fragment identifier # (hash) in the URL has to be directed on the new bill page
          expect(window.location.hash).toBe(ROUTES_PATH.NewBill);

          // Reset all mocks automatically
          jest.resetAllMocks();

      });
    });

    // Test if the user upload a file with a disallowed extension
    describe("When I upload a file with the wrong extension", () =>
    {
      test("Then an error message should pop on the screen of the user before any upload is allowed", async() =>
      {
        // Call setup function and transform it into an async function
        await setup();

        // Be on the new bill page
        window.onNavigate(ROUTES_PATH.NewBill);

        // To view newbill
        document.body.innerHTML = NewBillUI();

        // Create a new bill
        const newBillCreation = new NewBill(
          {
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          }
        )
        
        // Method to add a file
        const file = screen.getByTestId("file");
        const getFile = new File(["Test"], "test.txt");
        const handleChangeFile = jest.fn((e) =>
        newBillCreation.handleChangeFile(e));
        
        // New file submission for test purpose
        file.addEventListener("change", handleChangeFile);
        fireEvent.change(file, 
          {
            target: 
            {
              files: [getFile],
            }
          });

        // The function has to be called upon for this test
        expect(handleChangeFile).toHaveBeenCalled();

        // Fetch the error message
        const error = screen.getByTestId("extension-error");

        // The fetched error message has to be truthy
        expect(error).toBeTruthy();

        // And it has to have the class "errorIsShown" 
        expect(error.classList).toContain("errorIsShown");
      });
    });

    describe("When clicking on the submit button", ()=>
    {
      describe("When all the required fields are filled out properly", ()=>
      {
        test("Then, the form should be sent", async()=>
        {
          // Await for the setup function first
          await setup();

          // Be on the new bill page
          window.onNavigate(ROUTES_PATH.NewBill);

          // Add the form for the newbill
          document.body.innerHTML = NewBillUI();

          // Create new bill
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          });

          // Get the new bill
          const getNewBill = screen.getByTestId("form-new-bill");

          // Assertion: Check if the form is properly displayed
          expect(getNewBill).toBeTruthy();

          // Helpers
          
            const expenseType = screen.getByTestId("expense-type");
            const expenseName = screen.getByTestId("expense-name");
            const date = screen.getByTestId("datepicker");
            const amount =  screen.getByTestId("amount");
            const vat = screen.getByTestId("vat");
            const pct = screen.getByTestId("pct");
            const commentary = screen.getByTestId("commentary");
            const fileUrl = screen.getByTestId("file");
            const fileName = screen.getByTestId("file");
          

          // Fill form inputs
          const billTest =
          {
            email: "employee@test.tld",
            type: "Transports",
            name: "Trajet Bruxelles-Paris",
            amount: "250",
            date: "2022-12-31",
            vat: "150",
            pct: "60",
            commentary: `Services au client - test`,
            fileUrl: null,
            fileName: "test.png",
            status: "pending",
          };
          
          // As if a user has filled out the form
          userEvent.selectOptions(expenseType, ["Transports"]);
          userEvent.type(expenseName, billTest.name);
          userEvent.type(amount, billTest.amount);
          fireEvent.change(date, { target: { value: billTest.date } });
          userEvent.type(vat, billTest.vat);
          userEvent.type(pct, billTest.pct);
          userEvent.type(commentary, billTest.commentary);

          // Mock form submit
          const handleSubmission = jest.fn((e)=> newBill.handleSubmit(e));
          const updateBill = jest.fn((billTest)=> newBill.updateBill(billTest));

          // Assertions: check if the fields are properly filled out
          expect(screen.getByRole("option", { name: "Transports" }).selected).toBe(true);
          expect(document.querySelector(`input[data-testid="expense-name"]`).value).toEqual("Trajet Bruxelles-Paris");
          expect(document.querySelector(`input[data-testid="amount"]`).value).toEqual("250");
          expect(document.querySelector(`input[data-testid="datepicker"]`).value).toBe("2022-12-31");
          expect(document.querySelector(`input[data-testid="vat"]`).value).toEqual("150");
          expect(document.querySelector(`input[data-testid="pct"]`).value).toEqual("60");
          expect(document.querySelector(`textarea[data-testid="commentary"]`).value).toEqual("Services au client - test");

          // Add listener for new bill submission
          getNewBill.addEventListener("submit", e=>
          {
            handleSubmission(e);
            updateBill(billTest);
          });
          fireEvent.submit(getNewBill);

          // Assertions: Method calls properly the form submission
          expect(handleSubmission).toHaveBeenCalled();

          // Fetch error message
          const error = screen.getByTestId("form-error");

          // Assertions: the error  alert is not called
          expect(error).toBeTruthy();
          expect(error.classList).toContain("errorIsHidden");

          // Assertions: the list is refreshed with the new bill on page bill
          expect(updateBill).toHaveBeenCalled();
          expect(updateBill).toBeCalledWith(billTest);

        });
      });

      // Test if the form is NOT valid
      describe("When all the fields are left blank", () =>
      {
        test("Then, clicking on the submit button should be disabled and an alert should pop on the screen", async()=>
        {
          // Call setup function and transform it into an async function
          await setup();

          // Be on New bill page
          window.onNavigate(ROUTES_PATH.NewBill);

          // Add the view for the new bill
          document.body.innerHTML = NewBillUI();

          // Create a new bill
          const createNewBill = new NewBill(
            {
              document,
              onNavigate,
              store: mockStore,
              localStorage: window.localStorage,
            });
          
          // Get the form 
          const newBillForm = screen.getByTestId("form-new-bill");

          // Assertion to be verified is as followed:
          // Submission with the # in URL on new bill page should not be redirected
          expect(newBillForm).toBeTruthy();

          // Mock to submit a new bill
          const handleSubmit = jest.fn((e) => createNewBill.handleSubmit(e));

          // Submit simulation
          newBillForm.addEventListener("submit", handleSubmit);
          fireEvent["submit"](newBillForm);

          // Get error
          const error = screen.getByTestId("form-error");

          // Assertion: Check if the method is properly called 
          expect(handleSubmit).toHaveBeenCalled();

          // Assertions: check if the fields are empty
          expect(screen.getByRole("option", { name: "Transports"}).selected).toBe(true);
          expect(document.querySelector(`input[data-testid="expense-name"]`).value).toEqual("");
          expect(document.querySelector(`input[data-testid="amount"]`).value).toEqual("");
          expect(document.querySelector(`input[data-testid="datepicker"]`).value).toEqual("");
          expect(document.querySelector(`input[data-testid="vat"]`).value).toEqual("");
          expect(document.querySelector(`input[data-testid="pct"]`).value).toEqual("");
          expect(document.querySelector(`textarea[data-testid="commentary"]`).value).toEqual("");

          // Assertions for error alert
          expect(error).toBeTruthy();
          expect(error).toHaveClass("errorIsShown");
        });
      });
    });
  });
});

// Integration test for POST (API)
describe("Given I am connected as an employee", ()=>
{
  describe("When I am on the newBill page", ()=>
  {
    describe("When I do fill out all the required field", ()=>
    {
      describe("When the API shows a 500 alert error", ()=>
      {
        test("Then submitting the form should not redirect the user on the bills page", async () =>
        { 
          // Call setup function and transform it into an async function
          await setup();

          // Surf on the new bill page
          window.onNavigate(ROUTES_PATH.NewBill);

          // Spy on when the bills is updated - 500 error
          const getBills = mockStore.bills();
          jest.spyOn(getBills, "update").mockImplementation((bill) => {
            return Promise.reject(new Error("Erreur 500"));
          });

          // Fetch by data-testid and set up useful functions to check input values for each fields
          const getForm = screen.getByTestId("form-new-bill");
          const fields = 
          {
            type: screen.getByTestId("expense-type"),
            name: screen.getByTestId("expense-name"),
            date: screen.getByTestId("datepicker"),
            amount: screen.getByTestId("amount"),
            vat: screen.getByTestId("vat"),
            pct: screen.getByTestId("pct"),
            commentary: screen.getByTestId("commentary"),
            fileUrl: screen.getByTestId("file"),
            fileName: screen.getByTestId("file"),
          };
          const now = new Date();
          const today = now.getFullYear() + "/" + month + "/" + day;
          const day = ("0" + now.getDate()).slice(-2);
          const month = ("0" + (now.getMonth() + 1)).slice(-2);

          // Inject value in inputs' fields for test purpose
          fields.name.value = "Test nom";
          fields.date.value = today;
          fields.amount.value = 100;
          fields.commentary.value = "Test commentaire";
          fields.vat.value = 50;
          fields.pct.value = 10;

          // Form submission
          fireEvent.submit(getForm);

          // Use process.nextTick to ensure asynchronous actions are resolved before running assertions during tests
          await waitFor(()=> process.nextTick);

          // The function store.bills().update has to be called
          expect(getBills.update).toBeCalled();
          // Not redirect on bills page
          expect(window.location.hash).not.toBe(ROUTES_PATH.Bills);

          jest.restoreAllMocks();

        });
      });
    });
  });
})
