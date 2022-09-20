/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
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
      expect(windowIcon).toHaveClass("active-icon");

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
    })
  })
})
