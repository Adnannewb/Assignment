"""Populate every table with coherent demo data for the React frontend.

    python manage.py seed_demo            # create (or top up) the demo data
    python manage.py seed_demo --reset    # delete it first, then recreate
    python manage.py seed_demo --clear    # delete it and stop

Everything it creates is tagged: accounts share the DEMO_PREFIX username
prefix, and the other rows hang off those accounts, so --clear can remove
exactly what was seeded and nothing else.
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from appointments.models import Appointment
from billings.models import Bill
from departments.models import Department
from doctors.models import Doctor
from medicines.models import Medicine
from patients.models import Patient
from prescriptions.models import Prescription, PrescriptionMedicine
from users.models import User

DEMO_PREFIX = "demo."
DEMO_PASSWORD = "Demo@12345"

DEPARTMENTS = [
    ("Cardiology", "Heart and circulatory care, including ECG and echo."),
    ("Orthopaedics", "Bones, joints, fractures and sports injuries."),
    ("Paediatrics", "Care for infants, children and adolescents."),
    ("Dermatology", "Skin, hair and nail conditions."),
    ("Neurology", "Brain, spine and nervous system disorders."),
    ("General Medicine", "First point of contact for undiagnosed concerns."),
]

# (first, last, department index, specialization, experience)
DOCTORS = [
    ("Ayesha", "Rahman", 0, "Interventional Cardiology", 12),
    ("Tanvir", "Hossain", 1, "Orthopaedic Surgery", 9),
    ("Nusrat", "Jahan", 2, "Neonatology", 7),
    ("Imran", "Chowdhury", 3, "Cosmetic Dermatology", 5),
    ("Farhana", "Akter", 4, "Stroke Medicine", 14),
    ("Sabbir", "Ahmed", 5, "Internal Medicine", 4),
    ("Mehjabin", "Karim", 0, "Paediatric Cardiology", 8),
]

# (first, last, age, gender, blood group)
PATIENTS = [
    ("Rafiul", "Islam", 34, "male", "O+"),
    ("Sumaiya", "Haque", 27, "female", "A+"),
    ("Jubayer", "Alam", 45, "male", "B+"),
    ("Tahmina", "Begum", 61, "female", "AB+"),
    ("Rakib", "Hasan", 19, "male", "O-"),
    ("Nabila", "Sultana", 31, "female", "A-"),
    ("Shahriar", "Kabir", 52, "male", "B-"),
    ("Mitu", "Barua", 8, "female", "AB-"),
    ("Arif", "Mahmud", 40, "male", "O+"),
    ("Priya", "Das", 23, "female", "A+"),
    ("Kamrul", "Islam", 67, "male", "B+"),
    ("Lamia", "Noor", 15, "female", "O+"),
]

RECEPTIONISTS = [("Shirin", "Aktar"), ("Fahim", "Reza")]

# Doctors who have signed themselves up and are waiting to be vetted, so
# the administrator's approval queue isn't empty on a fresh install.
PENDING_DOCTORS = [("Sadia", "Islam"), ("Nayeem", "Rahman")]

ADDRESSES = [
    "House 12, Road 5, Dhanmondi, Dhaka 1205",
    "Flat 4B, 27 Gulshan Avenue, Dhaka 1212",
    "88 Zindabazar, Sylhet 3100",
    "House 9, Nasirabad Housing Society, Chattogram 4000",
    "142 Station Road, Khulna 9100",
    "Village Sonapur, Rajshahi 6000",
]

# (name, unit, description)
MEDICINES = [
    ("Napa", "500 mg tablet", "Paracetamol for fever and mild to moderate pain."),
    ("Napa Extra", "500 mg + 65 mg tablet", "Paracetamol with caffeine for headache."),
    ("Seclo", "20 mg capsule", "Omeprazole for acidity, reflux and gastric ulcer."),
    ("Monas", "10 mg tablet", "Montelukast for asthma and allergic rhinitis."),
    ("Fexo", "120 mg tablet", "Fexofenadine for allergy and urticaria."),
    ("Amodis", "400 mg tablet", "Metronidazole for anaerobic and protozoal infection."),
    ("Azithrocin", "500 mg tablet", "Azithromycin for respiratory tract infection."),
    ("Ceevit", "250 mg tablet", "Vitamin C supplement."),
    ("Maxpro", "20 mg capsule", "Esomeprazole for reflux oesophagitis."),
    ("Atorva", "10 mg tablet", "Atorvastatin for raised cholesterol."),
    ("Cardipin", "5 mg tablet", "Amlodipine for hypertension and angina."),
    ("Comet", "500 mg tablet", "Metformin for type 2 diabetes."),
    ("Losectil", "20 mg capsule", "Omeprazole, taken before meals."),
    ("Tufnil", "200 mg tablet", "Tolfenamic acid for migraine."),
    ("Bizoran", "5 mg + 50 mg tablet", "Amlodipine with losartan for blood pressure."),
    ("Xenapto", "0.005% eye drop", "Latanoprost for raised intraocular pressure."),
    ("Alatrol", "10 mg tablet", "Cetirizine for allergic rhinitis and itching."),
    ("Deslor", "5 mg tablet", "Desloratadine, non-drowsy antihistamine."),
]

DIAGNOSES = [
    ("Acute pharyngitis", "Rest and warm fluids. Return if fever persists past three days."),
    ("Essential hypertension, stage 1", "Reduce salt, walk 30 minutes daily. Review in one month."),
    ("Type 2 diabetes mellitus", "Check fasting glucose fortnightly. Dietitian referral made."),
    ("Migraine without aura", "Track triggers in a diary. Avoid skipping meals."),
    ("Gastro-oesophageal reflux", "Avoid late meals; raise the head of the bed."),
    ("Allergic rhinitis", "Dust-proof the bedroom. Continue if symptoms recur seasonally."),
    ("Iron deficiency anaemia", "Take with vitamin C, not with tea. Recheck haemoglobin in 8 weeks."),
    ("Lower back strain", "No heavy lifting for two weeks. Physiotherapy referral made."),
    ("Community-acquired pneumonia", "Complete the full course. Chest X-ray on review."),
    ("Atopic dermatitis", "Fragrance-free emollient twice daily; avoid hot showers."),
]

DOSAGES = ["1 + 0 + 1", "1 + 1 + 1", "0 + 0 + 1", "1 + 0 + 0", "½ + 0 + ½", "1 + 1 + 1 after meals"]
DURATIONS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "Continue"]


class Command(BaseCommand):
    help = "Seed the database with demo data for the frontend."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo data before seeding.",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing demo data and exit without seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(20260914)  # stable output across runs

        if options["reset"] or options["clear"]:
            self._clear()
            if options["clear"]:
                self.stdout.write(self.style.SUCCESS("Demo data cleared."))
                return

        departments = self._departments()
        medicines = self._medicines()
        admin = self._admin()
        receptionists = self._receptionists()
        pending = self._pending_doctors()
        doctors = self._doctors(departments)
        patients = self._patients()
        appointments = self._appointments(doctors, patients)
        prescriptions = self._prescriptions(appointments, medicines)
        bills = self._bills(patients)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        for label, count in [
            ("departments", len(departments)),
            ("medicines", len(medicines)),
            ("doctors", len(doctors)),
            ("patients", len(patients)),
            ("receptionists", len(receptionists)),
            ("doctors awaiting approval", len(pending)),
            ("appointments", len(appointments)),
            ("prescriptions", len(prescriptions)),
            ("bills", len(bills)),
        ]:
            self.stdout.write(f"  {count:>4}  {label}")

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Sign in with any of these:"))
        self.stdout.write(f"  admin         {admin.username}")
        self.stdout.write(f"  doctor        {doctors[0].user.username}")
        self.stdout.write(f"  receptionist  {receptionists[0].username}")
        self.stdout.write(f"  patient       {patients[0].user.username}")
        self.stdout.write(f"  password      {DEMO_PASSWORD}  (all demo accounts)")

    # ---------------------------------------------------------------- #

    def _clear(self):
        """Remove demo rows only. Deleting the accounts cascades to their
        doctor/patient profiles, appointments, prescriptions and bills."""
        deleted, _ = User.objects.filter(username__startswith=DEMO_PREFIX).delete()
        Department.objects.filter(name__in=[name for name, _ in DEPARTMENTS]).delete()
        Medicine.objects.filter(name__in=[name for name, _, _ in MEDICINES]).delete()
        self.stdout.write(f"Removed {deleted} demo rows.")

    def _user(self, handle, first, last, role, approved=True):
        username = f"{DEMO_PREFIX}{handle}"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "first_name": first,
                "last_name": last,
                "email": f"{handle}@medicore.demo",
            },
        )
        user.first_name = first
        user.last_name = last
        user.role = role
        user.is_approved = approved
        if created:
            user.set_password(DEMO_PASSWORD)
        user.save()
        return user

    def _departments(self):
        result = []
        for name, description in DEPARTMENTS:
            department, _ = Department.objects.get_or_create(
                name=name, defaults={"description": description}
            )
            result.append(department)
        return result

    def _medicines(self):
        result = []
        for name, unit, description in MEDICINES:
            medicine, _ = Medicine.objects.get_or_create(
                name=name, defaults={"unit": unit, "description": description}
            )
            result.append(medicine)
        return result

    def _admin(self):
        admin = self._user("admin", "Ariful", "Haque", "admin")
        # Give the demo admin the Django admin site too — convenient, and
        # IsAdmin already treats is_staff as an administrator.
        admin.is_staff = True
        admin.save()
        return admin

    def _receptionists(self):
        return [
            self._user(f"reception{index}", first, last, "receptionist")
            for index, (first, last) in enumerate(RECEPTIONISTS, start=1)
        ]

    def _pending_doctors(self):
        """Unapproved doctor accounts — they cannot sign in until an
        administrator approves them from the User accounts page."""
        return [
            self._user(f"pending{index}", first, last, "doctor", approved=False)
            for index, (first, last) in enumerate(PENDING_DOCTORS, start=1)
        ]

    def _doctors(self, departments):
        result = []
        for index, (first, last, dept_index, specialization, experience) in enumerate(
            DOCTORS, start=1
        ):
            user = self._user(f"doctor{index}", first, last, "doctor")
            doctor, _ = Doctor.objects.get_or_create(
                user=user,
                defaults={
                    "department": departments[dept_index],
                    "specialization": specialization,
                    "phone": f"017{index:08d}",
                    "experience": experience,
                    # One doctor off duty so the availability filter and the
                    # toggle have something to show.
                    "is_available": index != 4,
                },
            )
            result.append(doctor)
        return result

    def _patients(self):
        result = []
        for index, (first, last, age, gender, blood) in enumerate(PATIENTS, start=1):
            user = self._user(f"patient{index}", first, last, "patient")
            patient, _ = Patient.objects.get_or_create(
                user=user,
                defaults={
                    "age": age,
                    "gender": gender,
                    "blood_group": blood,
                    "address": ADDRESSES[index % len(ADDRESSES)],
                    "phone": f"018{index:08d}",
                },
            )
            result.append(patient)
        return result

    def _appointments(self, doctors, patients):
        """A spread of past and future visits so the dashboard, the date
        filter and every status badge have real rows behind them."""
        if Appointment.objects.filter(patient__in=patients).exists():
            return list(Appointment.objects.filter(patient__in=patients))

        now = timezone.now()
        plan = [
            # (days from now, hour, status)
            (-21, 10, "completed"),
            (-18, 15, "completed"),
            (-14, 9, "completed"),
            (-12, 16, "completed"),
            (-9, 11, "completed"),
            (-7, 14, "completed"),
            (-6, 10, "cancelled"),
            (-4, 12, "completed"),
            (-3, 17, "completed"),
            (-2, 9, "completed"),
            (0, 9, "approved"),
            (0, 11, "approved"),
            (0, 14, "pending"),
            (0, 16, "pending"),
            (1, 10, "approved"),
            (1, 15, "pending"),
            (2, 9, "approved"),
            (2, 13, "pending"),
            (3, 11, "approved"),
            (4, 16, "pending"),
            (5, 10, "pending"),
            (6, 14, "approved"),
            (8, 9, "pending"),
            (10, 15, "pending"),
            (12, 11, "cancelled"),
        ]

        result = []
        for index, (day_offset, hour, status) in enumerate(plan):
            when = (now + timedelta(days=day_offset)).replace(
                hour=hour, minute=0, second=0, microsecond=0
            )
            result.append(
                Appointment.objects.create(
                    patient=patients[index % len(patients)],
                    doctor=doctors[index % len(doctors)],
                    appointment_date=when,
                    status=status,
                )
            )
        return result

    def _prescriptions(self, appointments, medicines):
        """Every completed visit gets a prescription with 2-4 medicines, so
        the history view and the nested medicine list are populated."""
        completed = [a for a in appointments if a.status == "completed"]
        result = []

        for index, appointment in enumerate(completed):
            if hasattr(appointment, "prescription"):
                result.append(appointment.prescription)
                continue

            diagnosis, notes = DIAGNOSES[index % len(DIAGNOSES)]
            prescription = Prescription.objects.create(
                appointment=appointment, diagnosis=diagnosis, notes=notes
            )
            for medicine in random.sample(medicines, random.randint(2, 4)):
                PrescriptionMedicine.objects.create(
                    prescription=prescription,
                    medicine=medicine,
                    dosage=random.choice(DOSAGES),
                    duration=random.choice(DURATIONS),
                )
            result.append(prescription)

        return result

    def _bills(self, patients):
        """A mix of paid and unpaid so the billing summary tiles and the
        paid/unpaid filter both have something to show."""
        if Bill.objects.filter(patient__in=patients).exists():
            return list(Bill.objects.filter(patient__in=patients))

        now = timezone.now()
        amounts = [
            ("1500.00", True), ("3200.50", True), ("850.00", False),
            ("12400.00", False), ("2750.00", True), ("640.00", True),
            ("5100.75", False), ("1890.00", False), ("430.00", True),
            ("7300.00", False), ("980.25", True), ("2200.00", False),
            ("15600.00", False), ("720.00", True), ("3450.00", False),
        ]

        result = []
        for index, (amount, paid) in enumerate(amounts):
            bill = Bill.objects.create(
                patient=patients[index % len(patients)],
                amount=Decimal(amount),
                paid=paid,
            )
            # created_at is auto_now_add, so backdate it afterwards to give
            # the list a realistic spread rather than 15 identical stamps.
            Bill.objects.filter(pk=bill.pk).update(
                created_at=now - timedelta(days=index * 2, hours=index)
            )
            result.append(bill)
        return result
