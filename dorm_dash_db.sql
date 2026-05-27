-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 27, 2026 at 10:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dorm_dash_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddInquiry` (IN `p_property_id` INT, IN `p_tenant_id` INT, IN `p_lease_term` INT, IN `p_tenant_name` VARCHAR(100), IN `p_property_name` VARCHAR(100), IN `p_message` TEXT)   BEGIN
    INSERT INTO inquiries (property_id, tenant_id, lease_term_months, tenant_name, property_name, message, status) 
    VALUES (p_property_id, p_tenant_id, p_lease_term, p_tenant_name, p_property_name, p_message, 'pending');
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddLeaseRecord` (IN `p_property_id` INT, IN `p_tenant_id` INT, IN `p_property_name` VARCHAR(255), IN `p_monthly_rate` DECIMAL(15,2), IN `p_lease_term` INT, IN `p_unit_occupancy` VARCHAR(255))   BEGIN
    DECLARE v_total_calculated DECIMAL(15,2);
    
    -- Calculate complete lease valuation contract financials natively
    SET v_total_calculated = p_monthly_rate * p_lease_term;

    INSERT INTO rentings (
        property_id, 
        tenant_id, 
        property_name, 
        monthly_rate, 
        lease_term, 
        total_due, 
        pending_payment, 
        unit_occupancy,
        status, 
        start_date
    ) VALUES (
        p_property_id,
        p_tenant_id,
        p_property_name,
        p_monthly_rate,
        p_lease_term,
        v_total_calculated,
        v_total_calculated, -- Initial pending payment matches total due
        p_unit_occupancy,
        'Active',
        CURDATE()
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ApproveInquiry` (IN `p_inquiry_id` INT, IN `p_unit_occupancy` VARCHAR(50))   BEGIN
    -- This logic is handled via the Model using the database connection 
    -- because of the specific balance check requirements in your sample.
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ApproveInquiryRoutine` (IN `p_inquiry_id` INT, IN `p_unit_occupancy` VARCHAR(255))  MODIFIES SQL DATA BEGIN
    -- Declare operational and tracking tracking variables
    DECLARE v_property_id INT;
    DECLARE v_tenant_id INT;
    DECLARE v_lease_term INT;
    DECLARE v_property_name VARCHAR(255);
    DECLARE v_monthly_rate DECIMAL(15,2);
    DECLARE v_owner_id INT;
    DECLARE v_tenant_balance DECIMAL(15,2);
    DECLARE v_total_due DECIMAL(15,2);

    -- Setup structural transaction failure state error handler rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Transaction failed: Execution aborted inside database engine.';
    END;

    START TRANSACTION;

    -- 1. Fetch deep inquiry parameters 
    SELECT property_id, tenant_id, lease_term_months
    INTO v_property_id, v_tenant_id, v_lease_term
    FROM inquiries WHERE id = p_inquiry_id;

    -- Fallback structural confirmation triggers
    IF v_property_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inquiry not found.';
    END IF;

    -- 2. Fetch locked property tracking information
    SELECT name, price_monthly, owner_id 
    INTO v_property_name, v_monthly_rate, v_owner_id
    FROM properties WHERE id = v_property_id;

    IF v_monthly_rate IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Property configuration records not found.';
    END IF;

    -- 3. Check Tenant solvency with structural pessimistic row locking
    SELECT balance INTO v_tenant_balance 
    FROM users WHERE id = v_tenant_id FOR UPDATE;

    IF v_tenant_balance IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tenant account record missing.';
    END IF;

    IF v_tenant_balance < v_monthly_rate THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tenant has insufficient balance for initial month payment.';
    END IF;

    -- 4. Atomic Balance Transfer ledger manipulation steps
    UPDATE users SET balance = balance - v_monthly_rate WHERE id = v_tenant_id;
    UPDATE users SET balance = balance + v_monthly_rate WHERE id = v_owner_id;

    -- 5. Calculate global financial metrics
    SET v_total_due = v_monthly_rate * v_lease_term;

    -- 6. Insert new active operational contract record
    INSERT INTO rentings (
        property_id, 
        tenant_id, 
        property_name, 
        monthly_rate, 
        lease_term, 
        total_due, 
        status, 
        start_date, 
        unit_occupancy,
        months_pending, 
        pending_payment, 
        total_paid
    ) VALUES (
        v_property_id,
        v_tenant_id,
        v_property_name,
        v_monthly_rate,
        v_lease_term,
        v_total_due,
        'Active',
        CURDATE(),
        p_unit_occupancy,
        (v_lease_term - 1),
        (v_total_due - v_monthly_rate),
        v_monthly_rate
    );

    -- 7. Remove processed applications allocation structures
    DELETE FROM inquiries WHERE id = p_inquiry_id;

    COMMIT;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AuthLogin` (IN `p_email` VARCHAR(100))   BEGIN
    SELECT id, username, password 
    FROM users 
    WHERE email = p_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AuthRegister` (IN `p_username` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_password` VARCHAR(255))   BEGIN
    INSERT INTO users (username, email, password) 
    VALUES (p_username, p_email, p_password);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateInquiry` (IN `p_property_id` INT, IN `p_tenant_id` INT, IN `p_lease_term` INT, IN `p_tenant_name` VARCHAR(100), IN `p_property_name` VARCHAR(100), IN `p_message` TEXT)   BEGIN
    INSERT INTO inquiries (
        property_id, 
        tenant_id, 
        lease_term_months, 
        tenant_name, 
        property_name, 
        message, 
        status
    ) VALUES (
        p_property_id, 
        p_tenant_id, 
        p_lease_term, 
        p_tenant_name, 
        p_property_name, 
        p_message, 
        'pending'
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeclineInquiry` (IN `p_inquiry_id` INT)   BEGIN
    DELETE FROM inquiries WHERE id = p_inquiry_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeleteInquiry` (IN `p_inquiry_id` INT)   BEGIN
    DELETE FROM inquiries WHERE id = p_inquiry_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `DeletePropertyCascade` (IN `p_property_id` INT)   BEGIN
    DECLARE v_unpaid_count INT;

    -- Check for unpaid balances
    SELECT COUNT(*) INTO v_unpaid_count 
    FROM rentings 
    WHERE property_id = p_property_id AND total_paid < total_due;

    IF v_unpaid_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Cannot delete property. There are tenants with pending balances.';
    ELSE
        START TRANSACTION;
            -- Wipe secondary reference targets first
            DELETE FROM rentings WHERE property_id = p_property_id;
            -- Wipe core entity directory row target
            DELETE FROM properties WHERE id = p_property_id;
        COMMIT;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllInquiries` ()   BEGIN
    SELECT 
        id, 
        property_id, 
        tenant_id, 
        lease_term_months, 
        tenant_name, 
        property_name, 
        created_at, 
        message, 
        status 
    FROM inquiries;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllTenantsAdmin` ()   BEGIN
    SELECT 
        u.id, u.full_name, u.email, u.username,
        r.property_name, r.status as lease_status
    FROM users u
    INNER JOIN rentings r ON u.id = r.tenant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllTransactions` ()   BEGIN
    SELECT 
        id, 
        tenant_id, 
        renting_id, 
        property_id, 
        amount, 
        transaction_type, 
        payment_method, 
        status, 
        reference_number, 
        created_at, 
        owner_id, 
        months_paid, 
        unit_occupancy AS unit_occupancy
    FROM transactions;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetFilteredTransactions` (IN `p_user_id` INT, IN `p_unit_occupancy` VARCHAR(255))   BEGIN
    SELECT * FROM transactions 
    WHERE (owner_id = p_user_id OR tenant_id = p_user_id)
    AND unit_occupancy = p_unit_occupancy;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetInquiries` ()   BEGIN
    SELECT id, property_id, tenant_id, lease_term_months, tenant_name, property_name, created_at, message, status 
    FROM inquiries;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetLeaseDetails` (IN `p_lease_id` INT)   BEGIN
    SELECT 
        r.id AS id,
        r.property_id AS propertyId,
        r.property_name AS propertyName,
        r.start_date AS startDate,
        r.lease_term AS leaseTerm,
        r.monthly_rate AS monthlyRate,
        IFNULL(r.months_pending, 0) AS monthsPending,
        IFNULL(r.pending_payment, 0.00) AS pendingPayment,
        r.tenant_id AS tenantId,
        IFNULL(r.total_paid, 0.00) AS totalPaid,
        IFNULL(r.total_due, 0.00) AS totalDue,
        r.status AS status,
        p.image_url AS imageUrl,
        p.owner_id AS ownerId,
        r.unit_occupancy AS unitOccupancy
    FROM rentings r
    LEFT JOIN properties p ON r.property_id = p.id
    WHERE r.id = p_lease_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetLoginData` (IN `p_email` VARCHAR(100))   BEGIN
    SELECT id, username, password, email 
    FROM users 
    WHERE email = p_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetOccupancyReport` ()   BEGIN
    SELECT 
        (SELECT COUNT(*) FROM properties WHERE status = 'occupied') as occupied_units,
        (SELECT COUNT(*) FROM properties) as total_units,
        ((SELECT COUNT(*) FROM properties WHERE status = 'occupied') / (SELECT COUNT(*) FROM properties) * 100) as occupancy_rate;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetProperties` ()   BEGIN
    SELECT 
        p.id, 
        p.owner_id, 
        p.name, 
        p.location_address, 
        p.price_monthly, 
        p.type, 
        p.status, 
        p.image_url, 
        p.map_image_url, 
        p.created_at, 
        p.amenities, 
        u.full_name AS owner_name, 
        u.username, 
        u.profile_picture 
    FROM properties p 
    INNER JOIN users u ON p.owner_id = u.id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetPropertiesByOwner` (IN `p_owner_id` INT)   BEGIN
    SELECT p.*, u.full_name as owner_name, u.username, u.profile_picture 
    FROM properties p 
    JOIN users u ON p.owner_id = u.id 
    WHERE p.owner_id = p_owner_id
    ORDER BY p.id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetPropertyById` (IN `p_id` INT)   BEGIN
    SELECT p.*, u.full_name as owner_name, u.username, u.profile_picture 
    FROM properties p 
    JOIN users u ON p.owner_id = u.id 
    WHERE p.id = p_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetRevenueReport` ()   BEGIN
    SELECT 
        SUM(amount) as total_collected,
        COUNT(id) as total_transactions,
        MONTHNAME(created_at) as month
    FROM transactions 
    WHERE status = 'Success'
    GROUP BY MONTH(created_at);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetTenantHistory` (IN `p_tenant_id` INT)   BEGIN
    SELECT 
        t.id, 
        t.amount, 
        t.payment_method, 
        t.status, 
        t.reference_number, 
        t.created_at,
        t.renting_id,
        t.property_id,
        t.owner_id,
        t.months_paid,
        t.unit_occupancy,
        u.full_name AS tenant_name,
        p.name AS property_name
    FROM transactions t
    LEFT JOIN users u ON t.tenant_id = u.id
    LEFT JOIN properties p ON t.property_id = p.id
    WHERE t.tenant_id = p_tenant_id
    ORDER BY t.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetTenantsByOwner` (IN `p_owner_id` INT)   BEGIN
    SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.username,
        r.property_name, 
        r.status AS lease_status
    FROM users u
    INNER JOIN rentings r ON u.id = r.tenant_id
    INNER JOIN properties p ON r.property_id = p.id
    WHERE p.owner_id = p_owner_id
    ORDER BY u.full_name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetTenantsByProperty` (IN `p_property_id` INT)   BEGIN
    SELECT 
        r.id AS id,
        r.tenant_id AS tenantId,
        IFNULL(u.full_name, IFNULL(u.username, 'Unknown Tenant')) AS tenantName,
        r.unit_occupancy AS occupancy,
        IFNULL(r.lease_term, 0) AS leaseTerm,
        CASE 
            WHEN IFNULL(r.pending_payment, 0) > 0 THEN 'Pending'
            ELSE 'Up to date'
        END AS pendingStatus,
        IFNULL(r.pending_payment, 0.00) AS pendingPayment,
        IFNULL(r.total_paid, 0.00) AS totalPaid,
        IFNULL(r.total_due, 0.00) AS totalDue,
        DATE_FORMAT(r.start_date, '%M %e, %Y') AS startDate,
        IFNULL(r.monthly_rate, 0.00) AS monthlyRate
    FROM rentings r
    LEFT JOIN users u ON r.tenant_id = u.id
    WHERE r.property_id = p_property_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetUserLeases` (IN `p_user_id` INT)   BEGIN
    SELECT 
        r.id AS id,
        r.property_id AS propertyId,
        r.property_name AS propertyName,
        r.start_date AS startDate,
        r.lease_term AS leaseTerm,
        r.monthly_rate AS monthlyRate,
        IFNULL(r.months_pending, 0) AS monthsPending,
        IFNULL(r.pending_payment, 0.00) AS pendingPayment,
        r.tenant_id AS tenantId,
        IFNULL(r.total_paid, 0.00) AS totalPaid,
        IFNULL(r.total_due, 0.00) AS totalDue,
        r.status AS status,
        p.image_url AS imageUrl,
        p.owner_id AS ownerId,
        r.unit_occupancy AS unitOccupancy
    FROM rentings r
    LEFT JOIN properties p ON r.property_id = p.id 
    WHERE r.tenant_id = p_user_id OR p.owner_id = p_user_id
    ORDER BY r.id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetUserProfile` (IN `p_user_id` INT)   BEGIN
    SELECT 
        id, 
        username, 
        full_name, 
        email, 
        phone_number, 
        date_of_birth, 
        address, 
        country, 
        gender, 
        created_at, 
        balance, 
        profile_picture, 
        payment_methods 
    FROM users 
    WHERE id = p_user_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ManageProperty` (IN `p_action` VARCHAR(10), IN `p_id` INT, IN `p_owner_id` INT, IN `p_name` VARCHAR(255), IN `p_type` VARCHAR(50), IN `p_price` DECIMAL(15,2), IN `p_address` TEXT, IN `p_img` TEXT, IN `p_map_img` TEXT, IN `p_amenities` TEXT, IN `p_status` VARCHAR(50))   BEGIN
    IF p_action = 'add' THEN
        INSERT INTO properties (owner_id, name, type, price_monthly, location_address, image_url, map_image_url, amenities, status)
        VALUES (p_owner_id, p_name, p_type, p_price, p_address, p_img, p_map_img, p_amenities, 'available');
        
    ELSEIF p_action = 'edit' THEN
        UPDATE properties SET 
            name = COALESCE(p_name, name), 
            type = COALESCE(p_type, type), 
            price_monthly = COALESCE(p_price, price_monthly), 
            location_address = COALESCE(p_address, location_address),
            image_url = COALESCE(p_img, image_url), 
            map_image_url = COALESCE(p_map_img, map_image_url), 
            amenities = COALESCE(p_amenities, amenities)
        WHERE id = p_id;
        
    ELSEIF p_action = 'status' THEN
        UPDATE properties SET status = p_status WHERE id = p_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `PostPaymentRecord` (IN `p_tenant_id` INT, IN `p_owner_id` INT, IN `p_renting_id` INT, IN `p_property_id` INT, IN `p_unit_occupancy` VARCHAR(50), IN `p_amount` DECIMAL(10,2), IN `p_months_paid` INT, IN `p_months_pending` INT, IN `p_status` VARCHAR(20), IN `p_pending_payment` DECIMAL(10,2), IN `p_payment_method` VARCHAR(50), IN `p_reference_number` VARCHAR(20))   BEGIN
    -- 1. Deduct from the tenant's wallet
    UPDATE users 
    SET balance = balance - p_amount 
    WHERE id = p_tenant_id;

    -- 2. Update the renting record
    UPDATE rentings 
    SET 
        total_paid = total_paid + p_amount,
        months_pending = p_months_pending,
        pending_payment = p_pending_payment,
        status = p_status
    WHERE id = p_renting_id;

    -- 3. Record the transaction
    INSERT INTO transactions (
        tenant_id, owner_id, renting_id, property_id, unit_occupancy, 
        amount, months_paid, status, payment_method, reference_number
    )
    VALUES (
        p_tenant_id, p_owner_id, p_renting_id, p_property_id, p_unit_occupancy, 
        p_amount, p_months_paid, p_status, p_payment_method, p_reference_number
    );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ProcessPayment` (IN `p_tenant_id` INT, IN `p_renting_id` INT, IN `p_property_id` INT, IN `p_owner_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_months_paid` INT, IN `p_ref_no` VARCHAR(20))   BEGIN
    START TRANSACTION;

    -- 1. Deduct from tenant balance
    UPDATE users 
    SET balance = balance - p_amount 
    WHERE id = p_tenant_id AND balance >= p_amount;

    -- Strict confirmation check: Did the update succeed?
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment Failed: Tenant balance is insufficient or account invalid.';
    END IF;

    -- 2. Add to owner balance (Only runs if tenant update succeeded)
    UPDATE users 
    SET balance = balance + p_amount 
    WHERE id = p_owner_id;

    -- 3. Update Lease Record (Matches rentings table columns perfectly)
    UPDATE rentings 
    SET 
        total_paid = total_paid + p_amount,
        pending_payment = GREATEST(0.00, pending_payment - p_amount),
        months_pending = GREATEST(0, months_pending - p_months_paid)
    WHERE id = p_renting_id;

    -- 4. Log Transaction (Matches transactions table columns perfectly)
    INSERT INTO transactions (
        tenant_id, 
        renting_id, 
        property_id, 
        amount, 
        transaction_type, 
        payment_method, 
        status, 
        reference_number, 
        owner_id, 
        months_paid,
        unit_occupancy
    ) VALUES (
        p_tenant_id, 
        p_renting_id, 
        p_property_id, 
        p_amount, 
        'Rent Payment', 
        'Wallet', 
        'Success', 
        p_ref_no, 
        p_owner_id, 
        p_months_paid,
        (SELECT unit_occupancy FROM rentings WHERE id = p_renting_id LIMIT 1)
    );

    COMMIT;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RemoveTenant` (IN `p_renting_id` INT)   BEGIN
    DELETE FROM rentings WHERE id = p_renting_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateInquiryStatus` (IN `p_inquiry_id` INT, IN `p_status` ENUM('pending','accepted','rejected'))   BEGIN
    UPDATE inquiries 
    SET status = p_status 
    WHERE id = p_inquiry_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateUserProfile` (IN `p_user_id` INT, IN `p_username` VARCHAR(100), IN `p_full_name` VARCHAR(255), IN `p_phone_enc` TEXT, IN `p_phone_iv` VARCHAR(255), IN `p_phone_tag` VARCHAR(255), IN `p_dob` DATE, IN `p_address_enc` TEXT, IN `p_address_iv` VARCHAR(255), IN `p_address_tag` VARCHAR(255), IN `p_country` VARCHAR(100), IN `p_gender` VARCHAR(20), IN `p_profile_pic` TEXT, IN `p_payments` JSON)   BEGIN
    UPDATE users 
    SET 
        username = p_username, 
        full_name = p_full_name, 
        phone_number = p_phone_enc,
        phone_iv = p_phone_iv,
        phone_tag = p_phone_tag,
        date_of_birth = p_dob, 
        address = p_address_enc,
        address_iv = p_address_iv,
        address_tag = p_address_tag,
        country = p_country, 
        gender = p_gender,
        profile_picture = p_profile_pic,
        payment_methods = p_payments
    WHERE id = p_user_id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `inquiries`
--

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL,
  `tenant_name` varchar(255) DEFAULT NULL,
  `property_name` varchar(255) DEFAULT NULL,
  `property_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `balance` decimal(15,2) DEFAULT 0.00,
  `lease_term_months` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inquiries`
--

INSERT INTO `inquiries` (`id`, `tenant_name`, `property_name`, `property_id`, `tenant_id`, `balance`, `lease_term_months`, `message`, `status`, `created_at`) VALUES
(33, 'Eryhn Jann A. Dulay', 'Subic Bay View Apartment', 13, 1, 791500.00, 12, 'Hi! I am highly interested in renting this apartment for a year. Is it possible to schedule a viewing this coming weekend?', 'pending', '2026-05-25 12:49:55'),
(44, 'Juan Dela Cruz', 'Dulay Cozy Bedspace', 26, 3, 9780500.00, 6, 'Hello landlord, I would like to inquire if the bedspace is still available for the upcoming semester starting next month?', 'pending', '2026-05-25 12:49:55');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('condo','dorm','bedspace','apartment') NOT NULL,
  `price_monthly` decimal(10,2) NOT NULL,
  `location_address` text NOT NULL,
  `image_url` text DEFAULT NULL,
  `map_image_url` text DEFAULT NULL,
  `status` enum('available','occupied','unavailable') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `amenities` mediumtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `name`, `type`, `price_monthly`, `location_address`, `image_url`, `map_image_url`, `status`, `created_at`, `amenities`) VALUES
(3, 2, 'Greenview Bedspace', 'bedspace', 3500.00, 'Quezon City', 'eyJidWNrZXQiOiJwcmQtbGlmdWxsY29ubmVjdC1iYWNrZW5kLWIyYi1pbWFnZXMiLCJrZXkiOiJpbmdlc3Rlci8wMTk3NjM2OS05M2M0LTc0MjUtYmU1Zi0xNDAyM2ZlY2M0NWQvOTcxNTc0MmYzY2IxYjBjNjY1NjM0MTk1MmNlMWNjNDljZGNlZWQxN2E4MjVjNjAxZTgwZjJhMjNiMTdhMjZkMS5qcGVnIiwiYnJhbmQiOiJtaXR1bGEiLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MzgwLCJoZWlnaHQiOjIzMCwiZml0IjoiY292ZXIifX19 | eyJidWNrZXQiOiJwcmQtbGlmdWxsY29ubmVjdC1iYWNrZW5kLWIyYi1pbWFnZXMiLCJrZXkiOiJpbmdlc3Rlci8wMTk3NjM2OS05M2M0LTc0MjUtYmU1Zi0xNDAyM2ZlY2M0NWQvOTcxNTc0MmYzY2IxYjBjNjY1NjM0MTk1MmNlMWNjNDljZGNlZWQxN2E4MjVjNjAxZTgwZjJhMjNiMTdhMjZkMS5qcGVnIiwiYnJhbmQiOiJtaXR1bGEiLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MzgwLCJoZWlnaHQiOjIzMCwiZml0IjoiY292ZXIifX19 | eyJidWNrZXQiOiJwcmQtbGlmdWxsY29ubmVjdC1iYWNrZW5kLWIyYi1pbWFnZXMiLCJrZXkiOiJpbmdlc3Rlci8wMTk3NjM2OS05M2M0LTc0MjUtYmU1Zi0xNDAyM2ZlY2M0NWQvOTcxNTc0MmYzY2IxYjBjNjY1NjM0MTk1MmNlMWNjNDljZGNlZWQxN2E4MjVjNjAxZTgwZjJhMjNiMTdhMjZkMS5qcGVnIiwiYnJhbmQiOiJtaXR1bGEiLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MzgwLCJoZWlnaHQiOjIzMCwiZml0IjoiY292ZXIifX19', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', 'available', '2026-04-30 12:59:47', ''),
(5, 2, 'Harbor View Apartments', 'condo', 25000.00, 'Malate, Manila', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688 | https://images.unsplash.com/photo-1502672260266-1c1ef2d93688 | https://images.unsplash.com/photo-1502672260266-1c1ef2d93688 | https://images.unsplash.com/photo-1502672260266-1c1ef2d93688 ', 'https://images.unsplash.com/photo-1524661135-42399...', 'available', '2026-04-30 12:59:47', ''),
(6, 2, 'Metro Dormitory', 'dorm', 5500.00, 'Morayta, Manila', 'https://media-cdn.tripadvisor.com/media/photo-s/0a/fe/62/76/dorm-room.jpg', 'https://images.unsplash.com/photo-1524661135-42399...', 'available', '2026-04-30 12:59:47', ''),
(7, 2, 'Cozy Bedspace QC', 'bedspace', 4000.00, 'Katipunan, Quezon City', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf', 'https://images.unsplash.com/photo-1518780664697-55...', 'available', '2026-04-30 12:59:47', ''),
(8, 2, 'Makati Executive Suites', 'condo', 32000.00, 'Legazpi Village, Makati', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', 'https://images.unsplash.com/photo-1524661135-42399...', 'available', '2026-04-30 12:59:47', ''),
(9, 2, 'University Belt Dorms', 'dorm', 6000.00, 'España, Manila', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af', 'https://images.unsplash.com/photo-1502899576159-f2...', 'occupied', '2026-04-30 12:59:47', ''),
(10, 4, 'qqqqwewqewqe', 'condo', 99999999.99, '21e13231', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 'q', 'available', '2026-05-08 11:37:06', 'qq, qqq, qqqqq'),
(12, 5, 'Gordon Heights Elite Shared Spaces', 'condo', 4800.00, '123 Gordon Heights, Olongapo City, Zambales', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'https://maps.google.com/?q=BGC+Taguig', 'available', '2026-05-10 07:36:55', 'High-Speed Wi-Fi, Aircon, Submeter, Foam Bed, CCTV Security'),
(13, 2, 'Subic Bay View Apartment', 'apartment', 15000.00, 'Barretto, Olongapo City', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 'https://maps.google.com/?q=Barretto+Olongapo', 'available', '2026-05-10 07:36:55', 'Balcony, Parking, Pet-friendly'),
(14, 4, 'St. Rita Female Dorm', 'dorm', 4500.00, 'Sta. Rita, Olongapo City', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf', 'https://maps.google.com/?q=Sta+Rita+Olongapo', 'available', '2026-05-10 07:36:55', 'CCTV, Study Hall, Drinking Water'),
(15, 4, 'Zen Studio Makati', 'condo', 28000.00, 'Salcedo Village, Makati', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb', 'https://maps.google.com/?q=Salcedo+Village+Makati', 'available', '2026-05-10 07:36:55', 'Fully Furnished, Smart Home, Concierge'),
(20, 4, 'The Grand Dormitory', '', 5500.00, '123 University Belt, Manila', 'https://example.com/dorm.jpg', 'https://example.com/map.jpg', 'available', '2026-05-12 20:22:33', 'Free WiFi, Study Hall, Aircon'),
(26, 1, 'Dulay Cozy Bedspaces part 3!!!', 'apartment', 13200.00, 'Olongapo City', 'https://images.unsplash.com/photo-1554995207-c18c203602cb', '../images/profilePics/prof_pics.png', 'unavailable', '2026-05-25 12:49:55', 'basta may wifi, may pool din hahaha'),
(27, 1, 'Subic Bay Premium Condo', 'condo', 18000.00, 'Barretto, Olongapo City', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'https://maps.google.com/?q=Barretto+Olongapo', 'available', '2026-05-25 12:49:55', 'Swimming Pool, Gym, Balcony, 24/7 Security, Fully Furnished'),
(30, 1, 'Luxury City Condo', 'condo', 25000.00, 'Subic Bay, Philippines', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688|https://images.unsplash.com/photo-1524661135-423995f22d0b', 'https://images.unsplash.com/photo-1524661135-423995f22d0b', 'available', '2026-05-25 15:41:05', 'WiFi, Swimming Pool, Gym, 24/7 Security'),
(33, 1, 'qewqe', 'condo', 12313.00, 'dqwd', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1524661135-423995f22d0b', 'occupied', '2026-05-25 18:10:02', 'dwqd'),
(34, 1, 'test add', 'condo', 1123213.00, 'sta rita', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1524661135-423995f22d0b', 'available', '2026-05-27 07:49:07', 'wifi, wifi, wifi, pool');
INSERT INTO `properties` (`id`, `owner_id`, `name`, `type`, `price_monthly`, `location_address`, `image_url`, `map_image_url`, `status`, `created_at`, `amenities`) VALUES
(36, 1, 'testttt', 'condo', 123.00, 'testst', 'data:image/jpeg;base64,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', 'https://images.unsplash.com/photo-1524661135-423995f22d0b', 'available', '2026-05-27 11:22:43', 'testestse qweq,e qweqw eqw , qew eq eqw');
INSERT INTO `properties` (`id`, `owner_id`, `name`, `type`, `price_monthly`, `location_address`, `image_url`, `map_image_url`, `status`, `created_at`, `amenities`) VALUES
(37, 1, 'testinggg', 'condo', 12321321.00, 'banda dun', '/images/properties/maxresdefault.jpg', '/images/maps/default.png', 'available', '2026-05-27 11:26:47', 'adsdas asdasd. asdsad , deeerp'),
(38, 1, 'test', 'condo', 123.00, 'testtt', '/images/properties/157305-004-53D5D212.webp|/images/properties/images.jfif|/images/properties/maxresdefault.jpg|/images/properties/pitt-understanding-real-property.jpg', '/images/maps/prof_pics.png', 'available', '2026-05-27 11:37:38', '1231, 12341  wdawd... dwadwa, 213213d,,, , , ,'),
(39, 1, 'testtt', 'condo', 12314115.00, '123213123', '/images/properties/images.jfif|/images/properties/maxresdefault.jpg', '/images/maps/Large_World_Map_bright.jpg', 'available', '2026-05-27 11:41:45', 'rarar ararararar ra, arara ');

-- --------------------------------------------------------

--
-- Table structure for table `rentings`
--

CREATE TABLE `rentings` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `property_name` varchar(150) NOT NULL,
  `monthly_rate` decimal(10,2) NOT NULL,
  `lease_term` int(11) NOT NULL COMMENT 'Duration in months',
  `months_pending` int(11) DEFAULT 0,
  `pending_payment` decimal(10,2) DEFAULT 0.00,
  `total_paid` decimal(10,2) DEFAULT 0.00,
  `total_due` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `role` enum('tenant','occupant') DEFAULT 'tenant',
  `start_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `unit_occupancy` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rentings`
--

INSERT INTO `rentings` (`id`, `property_id`, `tenant_id`, `property_name`, `monthly_rate`, `lease_term`, `months_pending`, `pending_payment`, `total_paid`, `total_due`, `status`, `role`, `start_date`, `created_at`, `unit_occupancy`) VALUES
(16, 8, 4, 'Makati Executive Suites', 32000.00, 3, 0, 0.00, 96000.00, 96000.00, 'Up to date', 'tenant', '2026-04-02', '2026-05-10 14:43:09', 'hakdog'),
(18, 6, 1, 'Metro Dormitory', 5500.00, 3, -1, 0.00, 27500.00, 16500.00, 'Advanced payment', 'tenant', '2026-05-11', '2026-05-10 20:14:03', '112'),
(45, 14, 1, 'St. Rita Female Dorm', 4500.00, 3, 0, 0.00, 22500.00, 13500.00, 'Up to date', 'tenant', '2026-05-11', '2026-05-11 00:55:21', 'banda dun'),
(46, 5, 4, 'Harbor View Apartments', 25000.00, 50, -7, 0.00, 225000.00, 1250000.00, 'Advanced payment', 'tenant', '2026-05-12', '2026-05-11 20:27:06', 'dqwd'),
(47, 5, 2, 'Sunshine Dormitory', 5500.00, 6, 0, 27500.00, 5500.00, 33000.00, 'Active', 'tenant', '2026-05-15', '2026-05-15 15:49:38', NULL),
(48, 14, 1, 'Sta Rita Dorm Spaces', 4500.00, 6, -2, 0.00, 27000.00, 27000.00, 'Advanced payment', 'tenant', '2026-05-25', '2026-05-25 03:34:03', NULL),
(49, 14, 1, 'Sta Rita Dorm Spaces', 4500.00, 6, 1, 4500.00, 99000.00, 27000.00, 'Pending', 'tenant', '2026-05-25', '2026-05-25 03:35:21', NULL),
(50, 14, 1, 'Sta Rita Dorm Spaces', 4500.00, 6, 1, 4500.00, 4500.00, 27000.00, 'Pending', 'tenant', '2026-05-25', '2026-05-25 03:50:23', 'banda dun'),
(51, 14, 1, 'Sta Rita Dorm Spaces', 4500.00, 6, -4, 0.00, 27000.00, 27000.00, 'Advanced payment', 'tenant', '2026-05-25', '2026-05-25 03:56:07', 'Room 3B - Second Floor'),
(52, 12, 1, 'Gordon Heights Elite Shared Spaces', 4800.00, 6, -2, 0.00, 28800.00, 28800.00, 'Advanced payment', 'tenant', '2026-05-01', '2026-05-25 12:49:55', 'Room 2A'),
(53, 27, 5, 'Subic Bay Premium Condo', 18000.00, 12, -4, 0.00, 126000.00, 216000.00, 'Advanced payment', 'tenant', '2026-04-15', '2026-05-25 12:49:55', 'Unit 1402'),
(55, 26, 3, 'Dulay Cozy Bedspaces part 3!!!', 132.00, 6, 5, 660.00, 132.00, 792.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 18:37:31', 'banda dun'),
(56, 26, 3, 'Dulay Cozy Bedspaces part 3!!!', 13200.00, 6, 5, 66000.00, 13200.00, 79200.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 18:54:06', 'banda dun sa gitna'),
(57, 6, 1, 'Metro Dormitory', 5500.00, 5, 4, 22000.00, 5500.00, 27500.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 19:15:54', 'Potato middle'),
(58, 3, 1, 'Greenview Bedspace', 3500.00, 3, 2, 7000.00, 3500.00, 10500.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 19:16:52', 'Potato corner'),
(59, 26, 3, 'Dulay Cozy Bedspaces part 3!!!', 13200.00, 6, -1, 0.00, 52800.00, 79200.00, 'Advanced payment', 'tenant', '2026-05-28', '2026-05-27 19:17:17', 'hakdog'),
(60, 26, 3, 'Dulay Cozy Bedspaces part 3!!!', 13200.00, 6, -3, 0.00, 66000.00, 79200.00, 'Advanced payment', 'tenant', '2026-05-28', '2026-05-27 19:18:47', 'wallahi'),
(61, 26, 3, 'Dulay Cozy Bedspaces part 3!!!', 13200.00, 6, -2, 0.00, 79200.00, 79200.00, 'Advanced payment', 'tenant', '2026-05-28', '2026-05-27 19:38:10', 'dwqdqwdqwd'),
(62, 26, 3, 'Dulay Cozy Bedspaces part 3!!!', 13200.00, 6, 5, 66000.00, 13200.00, 79200.00, 'Active', 'tenant', '2026-05-28', '2026-05-27 20:08:03', 'dwadadad');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `renting_id` int(11) NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_type` varchar(50) DEFAULT 'Rent Payment',
  `payment_method` varchar(50) DEFAULT 'Wallet',
  `status` varchar(20) DEFAULT 'Success',
  `reference_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `owner_id` int(11) DEFAULT NULL,
  `months_paid` int(11) NOT NULL DEFAULT 0,
  `unit_occupancy` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `tenant_id`, `renting_id`, `property_id`, `amount`, `transaction_type`, `payment_method`, `status`, `reference_number`, `created_at`, `owner_id`, `months_paid`, `unit_occupancy`) VALUES
(10, 4, 46, 5, 25000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-B6729344', '2026-05-12 00:03:37', 2, 1, 'dqwd'),
(11, 1, 45, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-296D471F', '2026-05-12 01:33:25', 4, 1, 'banda dun'),
(16, 2, 47, 5, 5500.00, 'Rent Payment', 'Wallet', 'Success', 'REF-10101E65', '2026-05-16 14:07:52', 1, 1, NULL),
(18, 1, 45, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'REF-AA4AF070', '2026-05-24 22:48:46', 4, 1, 'banda dun'),
(19, 1, 45, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'REF-F5BAFDC3', '2026-05-24 22:49:26', 4, 1, 'banda dun'),
(20, 1, 45, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-D87E93F7', '2026-05-24 23:00:28', 4, 1, 'banda dun'),
(21, 1, 45, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-38C0A9FF', '2026-05-24 23:00:46', 4, 1, 'banda dun HAHAHA'),
(22, 1, 45, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-TEST001', '2026-05-26 01:00:00', 4, 1, 'Room 101'),
(23, 2, 47, 5, 5500.00, 'Utility Fee', 'Cash', 'Pending', 'REF-TEST002', '2026-05-26 02:30:00', 1, 0, 'Room 202'),
(24, 3, 50, 14, 4500.00, 'Rent Payment', 'Bank Transfer', 'Success', 'PAY-TEST003', '2026-05-26 03:15:00', 4, 1, 'Room 102'),
(25, 1, 45, 14, 1500.00, 'Late Fee', 'Wallet', 'Success', 'PAY-TEST004', '2026-05-26 06:00:00', 4, 0, 'Room 101'),
(30, 5, 48, 27, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-SUBIC-001', '2026-05-01 01:00:00', 1, 1, 'Unit 1402'),
(31, 5, 48, 27, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-SUBIC-002', '2026-05-26 02:00:00', 1, 1, 'Unit 1402'),
(32, 5, 48, 27, 500.00, 'Utility Fee', 'Cash', 'Pending', 'REF-SUBIC-003', '2026-05-26 02:05:00', 1, 0, 'Unit 1402'),
(33, 1, 18, 6, 5500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-80F9E535', '2026-05-27 12:55:04', 2, 1, '112'),
(34, 1, 18, 6, 5500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-20ED3F77', '2026-05-27 13:39:41', NULL, 1, '112'),
(35, 1, 18, 6, 5500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-EAA7258C', '2026-05-27 13:40:21', 2, 1, '112'),
(36, 1, 18, 6, 5500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-49D2EF81', '2026-05-27 13:44:56', NULL, 1, '112'),
(37, 1, 53, NULL, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-21B0B97B', '2026-05-27 14:11:20', 1, 1, NULL),
(38, 1, 53, NULL, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-F18D39B7', '2026-05-27 14:11:24', 1, 1, NULL),
(39, 1, 53, NULL, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-C31D356D', '2026-05-27 14:26:47', 1, 1, NULL),
(40, 1, 53, NULL, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-D953732E', '2026-05-27 14:27:10', 1, 1, NULL),
(41, 1, 53, 27, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-47C935FF', '2026-05-27 14:27:48', 1, 1, 'Unit 1402'),
(42, 1, 51, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-1597F590', '2026-05-27 14:31:11', 4, 1, 'Room 3B - Second Floor'),
(43, 1, 50, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-2CFD6865', '2026-05-27 14:31:20', 4, 1, 'banda dun'),
(44, 1, 48, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-B7FFF539', '2026-05-27 14:43:43', 4, 1, NULL),
(45, 1, 48, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-31CBD1EC', '2026-05-27 14:43:46', 4, 1, NULL),
(46, 1, 51, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-826A8EFC', '2026-05-27 14:44:09', 4, 1, 'Room 3B - Second Floor'),
(47, 1, 49, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-C041127F', '2026-05-27 14:44:23', 4, 1, NULL),
(48, 1, 49, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-462E4BB7', '2026-05-27 14:44:23', 4, 1, NULL),
(49, 1, 49, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-77494ACF', '2026-05-27 14:44:24', 4, 1, NULL),
(50, 1, 49, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-0BC4A727', '2026-05-27 14:44:25', 4, 1, NULL),
(51, 1, 49, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-332848D5', '2026-05-27 14:44:26', 4, 1, NULL),
(52, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-422D9757', '2026-05-27 14:44:29', 4, 2, NULL),
(53, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-12065898', '2026-05-27 14:44:29', 4, 2, NULL),
(54, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-067B5B04', '2026-05-27 14:44:30', 4, 2, NULL),
(55, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-901F5A70', '2026-05-27 14:44:30', 4, 2, NULL),
(56, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-0783E512', '2026-05-27 14:44:30', 4, 2, NULL),
(57, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-82130286', '2026-05-27 14:44:30', 4, 2, NULL),
(58, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-355CBB28', '2026-05-27 14:44:30', 4, 2, NULL),
(59, 1, 49, 14, 9000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-B2D598CA', '2026-05-27 14:45:00', 4, 2, NULL),
(60, 1, 49, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-C458286F', '2026-05-27 14:45:25', 4, 1, NULL),
(61, 1, 51, 14, 4500.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-778178FF', '2026-05-27 14:56:52', 4, 1, 'Room 3B - Second Floor'),
(62, 1, 53, 27, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-8CE564EE', '2026-05-27 14:58:17', 1, 1, 'Unit 1402'),
(63, 1, 53, 27, 36000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-8A068E8B', '2026-05-27 14:58:57', 1, 2, 'Unit 1402'),
(64, 1, 53, 27, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-8DE59129', '2026-05-27 14:59:05', 1, 1, 'Unit 1402'),
(65, 1, 53, 27, 18000.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-DA09C3AD', '2026-05-27 15:06:23', 1, 1, 'Unit 1402'),
(66, 1, 52, 12, 4800.00, 'Rent Payment', 'Wallet', 'Success', 'PAY-C361B72A', '2026-05-27 15:07:47', 5, 1, 'Room 2A'),
(67, 1, 53, 27, 18000.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-5C39C9A5', '2026-05-27 15:47:29', 1, 1, 'Unit 1402'),
(68, 1, 52, 12, 4800.00, 'Rent Payment', 'gCash', 'Pending', 'PAY-11DA1AC8', '2026-05-27 15:48:34', 5, 1, 'Room 2A'),
(69, 1, 52, 12, 4800.00, 'Rent Payment', 'gCash', 'Up to date', 'PAY-A088A816', '2026-05-27 15:49:08', 5, 1, 'Room 2A'),
(70, 1, 53, 27, 18000.00, 'Rent Payment', 'cash', 'Advanced payment', 'PAY-AA0E2474', '2026-05-27 15:49:34', 1, 1, 'Unit 1402'),
(71, 1, 53, 27, 18000.00, 'Rent Payment', 'gCash', 'Advanced payment', 'PAY-D97D94E1', '2026-05-27 15:49:50', 1, 1, 'Unit 1402'),
(72, 1, 52, 12, 4800.00, 'Rent Payment', 'cash', 'Pending', 'PAY-F30012D7', '2026-05-27 16:52:56', 5, 1, 'Room 2A'),
(73, 1, 52, 12, 9600.00, 'Rent Payment', 'bankTransfer', 'Up to date', 'PAY-EF9A689D', '2026-05-27 16:53:10', 5, 2, 'Room 2A'),
(74, 1, 52, 12, 14400.00, 'Rent Payment', 'gCash', 'Advanced payment', 'PAY-97049EB0', '2026-05-27 16:53:25', 5, 3, 'Room 2A'),
(75, 1, 48, 14, 4500.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-20D9EF29', '2026-05-27 17:42:10', 4, 1, NULL),
(76, 1, 48, 14, 13500.00, 'Rent Payment', 'gCash', 'Advanced payment', 'PAY-2D12FCC0', '2026-05-27 17:42:42', 4, 3, NULL),
(77, 1, 51, 14, 9000.00, 'Rent Payment', 'gCash', 'Advanced payment', 'PAY-EA16BB1F', '2026-05-27 17:43:18', 4, 2, 'Room 3B - Second Floor'),
(78, 1, 51, 14, 4500.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-F797A79B', '2026-05-27 17:43:27', 4, 1, 'Room 3B - Second Floor'),
(85, 1, 61, 26, 13200.00, 'Rent Payment', 'payMaya', 'Up to date', 'PAY-5B7F5896', '2026-05-27 19:40:57', 1, 1, 'dwqdqwdqwd'),
(86, 1, 59, 26, 13200.00, 'Rent Payment', 'gCash', 'Up to date', 'PAY-56B9FAB0', '2026-05-27 19:41:08', 1, 1, 'hakdog'),
(87, 1, 61, 26, 13200.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-29C933FF', '2026-05-27 19:41:23', 1, 1, 'dwqdqwdqwd'),
(88, 1, 61, 26, 39600.00, 'Rent Payment', 'gCash', 'Advanced payment', 'PAY-30FC07A2', '2026-05-27 19:41:36', 1, 3, 'dwqdqwdqwd'),
(89, 1, 60, 26, 13200.00, 'Rent Payment', 'payMaya', 'Up to date', 'PAY-2055E481', '2026-05-27 19:44:43', 1, 1, 'wallahi'),
(90, 1, 59, 26, 26400.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-44B6FE07', '2026-05-27 19:45:08', 1, 2, 'hakdog'),
(91, 1, 60, 26, 26400.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-CF2346CF', '2026-05-27 19:47:28', 1, 2, 'wallahi'),
(92, 1, 60, 26, 13200.00, 'Rent Payment', 'payMaya', 'Advanced payment', 'PAY-B13B4C57', '2026-05-27 20:07:32', 1, 1, 'wallahi');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `phone_iv` varchar(255) DEFAULT NULL,
  `phone_tag` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `address_iv` varchar(255) DEFAULT NULL,
  `address_tag` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `balance` decimal(15,2) DEFAULT 0.00,
  `profile_picture` text DEFAULT NULL,
  `payment_methods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Stores gCash, payMaya, etc. as JSON' CHECK (json_valid(`payment_methods`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `full_name`, `email`, `phone_number`, `phone_iv`, `phone_tag`, `date_of_birth`, `address`, `address_iv`, `address_tag`, `country`, `gender`, `password`, `created_at`, `balance`, `profile_picture`, `payment_methods`) VALUES
(1, 'Eryhn', 'Eryhn Jann Amarille', '202311107@gordoncollege.edu.ph', 'eUTpEa7gi0GcRQ==', 'Rczy/wJf+L8lvvrX', 'l6yiTK9Xfuqpo0WSj3y71A==', '2003-11-11', '99Jhm3a0LMUrrcRNuhW4Tjotqz382g2mUH9KnqmQaCxu', 'HVcOPmsLicU2G3+H', 'qv/TkSEzCagwedEcj9Mq5w==', 'Netherlands', 'Female', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-04-30 12:59:47', 656232.00, '/images/profilePics/0e2066b6-b64c-457c-9140-c45adaf79bdc.jfif', '{\"gCash\":true,\"payMaya\":true,\"bankTransfer\":false,\"cash\":false}'),
(2, 'j_smith99', 'Jane Smith', 'maria@property.com', 'BqXJiJYwkG7lmtoCYw==', 'PRYqHD6Vwj9B153i', 'HnhSnOKrKMG4DeqZC8Rmfw==', '1999-02-14', '7jcgmH9wq4tS5z74sac+Ml1RenDEn01ddbnu', '7OONA5v3r3twwESl', 'vPLA/5PMRNIQfie0iT5tiA==', 'Philippines', 'Female', 'hash123', '2026-04-30 12:59:47', 20000.00, 'https://example.com/profiles/jane.jpg', '[\"GCash\",\"Bank Transfer\"]'),
(3, 'Juan Dela Cruz', 'Juan Dela Cruz', 'juan@student.com', '09229876543', NULL, NULL, '2004-11-20', '456 Narra Ave., Olongapo City', NULL, NULL, 'Philippines', 'Male', 'hash123', '2026-04-30 12:59:47', 99999933999.00, NULL, NULL),
(4, '', '', 'eryhnjannamarille1@gmail.com', '', '', '', '2000-01-01', '', '', '', '', 'Male', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-01 00:40:03', 410000.00, '../images/profilePics/prof_pics.png', '{}'),
(5, 'alice_renter', 'Alice Guo', 'alice.guo@example.com', '09171234567', NULL, NULL, '1995-05-15', 'Unit 12, Blue Residences, Katipunan Ave, QC', NULL, NULL, 'Philippines', 'Female', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-10 07:36:39', 9800.00, NULL, '{\"gcash\": \"09171234567\", \"paymaya\": null}'),
(6, 'charli_dev', 'Charlie Dayrit', 'charlie.d@sarisaritech.com', '09225550011', NULL, NULL, '1998-12-30', 'Subic Bay Freeport Zone, Olongapo', NULL, NULL, 'Philippines', 'Non-binary', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-10 07:36:39', 0.00, NULL, NULL),
(7, 'j_smith99', 'Jane Smith', 'dvilla@student.edu.ph', '4NKO/FcmeK58OZOhmA==', 'AxKSI20PrEBcZiwQ', '4oSozk4vEH8Vm8sdKnqPIA==', '1999-02-14', 'Z+bIXhMExX6cQrlGWrlEP0BjV/fb2Q4CWG0l', 'QcV0pUZzQsinlVF+', 'N+Bh/wgmhs3Vxb+iG2nmeA==', 'Philippines', 'Female', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-10 07:36:39', 1200.50, 'https://example.com/profiles/jane.jpg', '[\"GCash\",\"Bank Transfer\"]'),
(8, 'eryhn_jann', 'Eryhn Jann Dulay', 'erik.matti@films.ph', 'voy0Uo3Mf2aH3dY=', 'T6iBClAZF459NLUu', 'K2PJ1QLJQK717rIXwQ/H+g==', '2004-08-15', '26luNyvOhja+UytOWyr86284HTzYnOJNET+y1W/rLH7A7QtHW/VE', 'OT8X99cCplpRD0k+', 'Sq4FtLYVV27j/Pzb6ZcQtg==', 'Philippines', 'Male', '$2y$10$sJT0T.w./u0.jldzLH1QEOYo143vmT.JxWHl.3ImmpR1jcbuvEWie', '2026-05-10 07:36:39', 25000.00, 'uploads/profiles/default.png', '{\"primary\":\"GCash\",\"account_number\":\"09123456789\"}'),
(9, 'johndoe', 'John Doe', 'john@example.com', 'HUCg/2s3djj5OnQ=', '3cCcnx16cvtrw97s', '1gERdhW0LGHdKZVYlxrMCQ==', '1995-01-01', 'nfcVB+BP+uYCb+3bb7NPbApn', 'u8vj31nKlWc65fg/', 'CEyGP77g/K7fIeWIunxI7A==', 'Philippines', 'Male', '$2y$10$4/422kVvCAnp2YTtgd6ymewRZcOJazX8QEx6f1JwPNq/G2kQU4Ovy', '2026-05-15 15:34:44', 0.00, 'https://example.com/photo.jpg', '{\"card\":\"visa\"}'),
(10, 'Gloomskieeee', NULL, 'eryhnjannamarille12@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$9NVupp2/tvL0LeZN0LLSyePr16IZp4YQdfMRNADwBf/io2/K96a/e', '2026-05-21 21:23:27', 0.00, NULL, NULL),
(11, 'Bloomskieee', NULL, 'eryhnjannamarille123@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$v0ep21CpREpuz8ncr99LbeczdvoED.n.6chsOJhbV2lpjIJQ2sEES', '2026-05-22 03:35:24', 0.00, NULL, NULL),
(12, 'Password123!', NULL, 'test@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '$2y$10$hoHUU/XSQbc7M74TcTf8ZOx3l163/JMFbnHCkTivuR7JxzVTp//wO', '2026-05-25 15:03:48', 0.00, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `fk_tenant_balance` (`tenant_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `rentings`
--
ALTER TABLE `rentings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `tenant_id` (`tenant_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_number` (`reference_number`),
  ADD KEY `tenant_id` (`tenant_id`),
  ADD KEY `renting_id` (`renting_id`),
  ADD KEY `fk_transaction_property` (`property_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `rentings`
--
ALTER TABLE `rentings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `inquiries`
--
ALTER TABLE `inquiries`
  ADD CONSTRAINT `fk_tenant_balance` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inquiries_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inquiries_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rentings`
--
ALTER TABLE `rentings`
  ADD CONSTRAINT `rentings_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rentings_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transaction_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`renting_id`) REFERENCES `rentings` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
