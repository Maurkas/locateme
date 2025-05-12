// presets.js
export const infrastructurePresets = {
    student: {
      name: "Для студентов",
      icon: "🎓",
      filters: {
        stops: "close",
        school: "any",
        kindergarten: "any",
        pickup_point: "close",
        polyclinic: "any",
        center: "close",
        gym: "close",
        mall: "close",
        college_and_university: "close",
        beauty_salon: "any",
        pharmacy: "any",
        grocery_store: "close",
        religious: "any",
        restaurant: "close",
        bank: "any",
        park: "any"
      },
      description: "Учебные заведения, транспорт и кафе рядом"
    },
    senior: {
      name: "Для пенсионеров",
      icon: "👵",
      filters: {
        stops: "far",
        school: "far",
        kindergarten: "far",
        pickup_point: "any",
        polyclinic: "close",
        center: "any",
        gym: "any",
        mall: "far",
        college_and_university: "far",
        beauty_salon: "any",
        pharmacy: "close",
        grocery_store: "close",
        religious: "close",
        restaurant: "any",
        bank: "close",
        park: "close"
      },
      description: "Медицина, магазины и парки рядом, спокойная локация"
    },
    family: {
      name: "Для семей",
      icon: "👨‍👩‍👧‍👦",
      filters: {
        stops: "close",
        school: "close",
        kindergarten: "close",
        pickup_point: "any",
        polyclinic: "close",
        center: "any",
        gym: "any",
        mall: "far",
        college_and_university: "any",
        beauty_salon: "any",
        pharmacy: "close",
        grocery_store: "close",
        religious: "any",
        restaurant: "any",
        bank: "any",
        park: "close"
      },
      description: "Школы, детсады и поликлиники рядом, парки в шаговой доступности"
    },
    business: {
      name: "Для бизнеса",
      icon: "💼",
      filters: {
        stops: "close",
        school: "any",
        kindergarten: "any",
        pickup_point: "close",
        polyclinic: "any",
        center: "close",
        gym: "close",
        mall: "close",
        college_and_university: "any",
        beauty_salon: "close",
        pharmacy: "any",
        grocery_store: "any",
        religious: "any",
        restaurant: "close",
        bank: "close",
        park: "any"
      },
      description: "Офисные центры, банки и рестораны рядом"
    }
  };