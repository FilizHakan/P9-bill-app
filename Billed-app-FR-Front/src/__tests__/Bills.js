/**
 * @jest-environment jsdom
 */

import store from "../__mocks__/store"
import userEvent from "@testing-library/user-event"
import {screen, waitFor, prettyDOM} from "@testing-library/dom"
import Bills from "../containers/Bills.js"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Create an object with the adaquate properties
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      // Create a div like in the DOM
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      // Initialise router function
      router()

      // Surfing on Bills page 
      window.onNavigate(ROUTES_PATH.Bills)

      // Get the tested icon
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      console.log(windowIcon)

      // Check that the icon has the highlighted class given by active-icon
      expect(windowIcon).toBeTruthy();
      expect(windowIcon.classList).toContain("active-icon");

    })
    test("Then bills should be ordered from earliest to latest", () => {
      // Add the view on the Bill page
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Get the dates
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      
      // Sort dates by ascending order
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      
      // Test if the dates are sorted like as in the test
      expect(dates).toEqual(datesSorted)
    });

    // describe when I click on the "new bill" button
    // - test(then the new bill should be shown)

    // describe when I click on the icon eye
    // - test then the function is called
    // - test then the bill is shown
    // - test then the right bill is shown
    // - integration test GET 'fetch bills from mock API GET'

    // describe when an error occurs with the API (beforeEach)
    // - test when bills are fetched from the API and it fails with 404 message error'
    // - test when fetch message from the API and it fails with 500 message error'
  })
})
