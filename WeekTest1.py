def guess(low,high,target,attempts=0):
    if(low>high):
        print("Invalid range")
        return attempts
    attempts+=1
    computer_number=(low+high)//2
    print(f"\nComputer guesses: {computer_number}")
    if computer_number > target:
        print("H")  
        return guess(low, computer_number - 1, target, attempts)

    elif computer_number < target:
        print("L") 
        return guess(computer_number + 1, high, target, attempts)
    else:
        print("C") 
        return attempts  

if __name__ == "__main__":
    while(True):
        print("\nWelcome To Number Guessing Game")
        print("1.Play\n2.Exit")
        choice=int(input(("\nEnter Your choice(only 1 or 2): ")))
        if(choice==1):
            target = int(input("Enter your number (1–100): "))
            attempts=guess(1,100,target)
            print(f"\nComputer guessed your number in {attempts} tries!")
        else:
            print("\nThank you for playing.Bye👋")
            break
    
