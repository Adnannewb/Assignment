class Calculator(): 
    def add(self,a,b):
        return a+b
    def subtract(self,a,b):
        return a-b
    def multiply(self,a,b):
        return a*b
    def divide(self,a,b):
        if b == 0:
            return "Error: Cannot divide by zero"
        return a / b   
    def menu(self):
        print("--------->Welcome to the the Calculator <--------")
        print("""
        1.ADD
        2.SUBTRACT
        3.MULTIPLY
        4.DIVIDE
        5.EXIT
            """)
    def user_input(self):
        while(True):
                try:
                    num1=int(input("Enter First Number: "))
                    num2=int(input("Enter Second Number: "))
                    return num1, num2
                except ValueError:
                    print("Enter Valid Number! ")
                except:
                    print("Invalid Input")
             
    def run(self):
        while(True):
            self.menu()
            try:
                choice = int(input("Enter Your Choice(between 1-5): "))
            except ValueError:
                print("Invalid choice! Enter a number between 1-5.")
                continue
            if choice == 5:
                print("Thank You for using!")
                break
            if choice not in [1, 2, 3, 4]:
                print("Invalid choice! Enter a number between 1-5.")
                continue
            num1, num2 = self.user_input()
            if choice == 1:
                result = self.add(num1, num2)
                op = "+"
            elif choice == 2:
                result = self.subtract(num1, num2)
                op = "-"
            elif choice == 3:
                result = self.multiply(num1, num2)
                op = "*"
            elif choice == 4:
                result = self.divide(num1, num2)
                op = "/"
            
            print(f"{num1} {op} {num2} = {result}")

if __name__ == "__main__":
    
    calc=Calculator()
    calc.run()
    