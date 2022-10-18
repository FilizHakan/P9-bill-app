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

jest.mock("../app/Store", () => mockStore);

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
  beforeEach(() => 
  {
    jest.clearAllMocks();
  });
  
  afterEach(() => 
  {
    jest.clearAllMocks();
  });

  describe("When I am on NewBill Page", () => 
  {
    // TEST 3: no error message should be shown on NewBill page
    test("Then, an error message should not pop on the screen", async() =>
    {
      // Await setup function first
      await setup();

      // Navigate on the new bill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Monitor the function when creating a new bill ("note de frais") with a spy
      // Fetch bills() from app/Router
      const bills = mockStore.bills();
      // Spy when there is a bill creation
      const newBill = jest.spyOn(bills, "create");

      // Fetch the form error
      const formError = screen.getByTestId("form-error");
      // The form error has to be truthy
      expect(formError).toBeTruthy();
      // The form error has to have the class "errorIsHidden"
      expect(formError).toHaveClass("errorIsHidden");

    });

    // TEST 1: Upload a file that is allowed jpeg, jpg or png
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
        const bills = mockStore.bills();
        // Spy jest when there is a bill creation
        const newBill = jest.spyOn(bills, "create");

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
          expect(bills.create).not.toBeCalled();
          // The fragment identifier # (hash) in the URL has to be directed on the new bill page
          expect(window.location.hash).toBe(ROUTES_PATH.NewBill);

      });
    });

    // TEST 2: if the user upload a file with a disallowed extension
    describe("When I upload a file with the wrong extension", () =>
    {
      test("Then, the file should not upload and an error message should pop on the screen before any upload", async() =>
      {
        // Call setup function and transform it into an async function
        await setup();

        // Be on the new bill page
        window.onNavigate(ROUTES_PATH.NewBill);

        // To view newbill
        document.body.innerHTML = NewBillUI();

        // Create a new bill
        const newBill = new NewBill(
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
        newBill.handleChangeFile(e));
        
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

    // TEST 4: Once the form is fully filed out, the form should be sent with no error message
    describe("When I click on the submit button", ()=>
    {
      describe("When all the required fields are filled out properly", ()=>
      {
        test("Then, the form should be sent and no error message should pop on the screen", async()=>
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
          const formE1 = screen.getByTestId("form-new-bill");

          // Assertion: Check if the form is properly displayed
          expect(formE1).toBeTruthy();

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
          const handleSubmit = jest.fn((e)=> newBill.handleSubmit(e));
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
          formE1.addEventListener("submit", e=>
          {
            handleSubmit(e);
            updateBill(billTest);
          });
          fireEvent.submit(formE1);

          // Assertions: Method calls properly the form submission
          expect(handleSubmit).toHaveBeenCalled();

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

      // TEST 5: if the form is NOT valid
      describe("When all the fields are left blank", () =>
      {
        test("Then, clicking on the submit button should do nothing and an alert should pop on the screen", async()=>
        {
          // Call setup function and transform it into an async function
          await setup();

          // Be on New bill page
          window.onNavigate(ROUTES_PATH.NewBill);

          // Add the view for the new bill
          document.body.innerHTML = NewBillUI();

          // Create a new bill
          const newBill = new NewBill(
            {
              document,
              onNavigate,
              store: mockStore,
              localStorage: window.localStorage,
            });
          
          // Get the form 
          const formE1 = screen.getByTestId("form-new-bill");

          // Assertion to be verified is as follow:
          // Submission with the # in URL on new bill page should not be redirected
          expect(formE1).toBeTruthy();

          // Mock to submit a new bill
          const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

          // Submit simulation
          formE1.addEventListener("submit", handleSubmit);
          fireEvent["submit"](formE1);

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

      // TEST 6: Integration test for POST (API)
      describe("When the API throws an error", () => 
      {
        test("POST New Bill and fails with 500 message error", async () => 
        {
          // Call setup function and transform it into an async function
          await setup();
          // Surf on the new bill page
          window.onNavigate(ROUTES_PATH.NewBill);
          // Spy on when the bills is updated - 500 error
          const bills = mockStore.bills();
          jest.spyOn(bills, "update").mockImplementation((bill) => {
            return Promise.reject(/Erreur 500/);
          });
          await waitFor(() => process.nextTick);
          // Assertions: Not redirect on bills page
          expect(window.location.hash).not.toBe(ROUTES_PATH.Bills);
          // Refresh all mocks
          jest.clearAllMocks();
        });
      });
    });
  });
});

